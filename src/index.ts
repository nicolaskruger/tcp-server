import { createServer, Socket } from "net"

type Message = {
    name: string,
    msg: string
}

const sockets: { list: Socket[] } = { list: [] }

type ligth = {
    state: 'on' | 'off'
}

const ligths: ligth[] = '-'.repeat(3).split('').map(_ => ({
    state: 'off'
}));

const toCommand = (message: string) => (message.match(/\S+/ig)?.map(element=> element) || [] )

const validade = (invalid: boolean, message: string) => { if (invalid) throw new Error(message) } 

const validator = (commands: string[], valid: ((commands: string[]) => void)[]) => {
    valid.forEach(valid => valid(commands))
}

const validateHelp: ((commands: string[]) => void)[] = [
    (commands) => { validade(commands.length != 1, "command help only have one paramter") },
]  

const validateTurn: ((commands: string[]) => void)[] = [
    (commands) => { validade(commands.length != 3, "command turn only have 3 paramter") },
    (commands) => { validade(!['on', 'off'].includes(commands[1]), "firt paramter have to be 'on' or 'off'") },
    (commands) => { validade(isNaN(Number(commands[2])) || !Number.isInteger(Number(commands[2])), "second param must be a number") },
    (commands) => { validade(!(Number(commands[2])>=0 && Number(commands[2]) < ligths.length), `second param must be betwen 0 and ${ligths.length -1}`) }
]

const validToogle: ((commands: string[]) => void)[] = [
    (commands) => { validade(commands.length != 2, "command toogle only have 2 paramter") },
    (commands) => { validade(isNaN(Number(commands[1])) || !Number.isInteger(Number(commands[1])), "first param must bee a number") },
    (commands) => { validade(!(Number(commands[1]) >= 0 && Number(commands[1]) < ligths.length), `first param must be betwen 0 and ${ligths.length - 1}`) }
]

const validList: ((commands: string[]) => void)[] = [
    (commands) => { validade(commands.length != 1, "command list only have 1 paramter") },
]

const command = {
    help: (params: string[]) => {
        validator(params, validateHelp)
        return JSON.stringify(["help", "turn <on|off> <index>", "toogle <index>", "list"]);
    },
    turn: (params: string[]) => {
        validator(params, validateTurn)
        const option = params[1] as "on" | "off"
        const index = Number(params[2]) 
        ligths[index].state = option
        return params.join(" ");
    },
    toogle: (params: string[]) => {
        validator(params, validToogle)        
        const index = Number(params[1])
        const option = ligths[index].state;

        ligths[index].state = option === "on" ? "off" : "on"

        return params.join(" ")
    },
    list: (params: string[]) => {
        validator(params, validList)
        return JSON.stringify(ligths)
    },
}


const keys = Object.keys(command) as (keyof typeof command)[]

const validateComand: ((commands: string[]) => void)[] = [
    (commands) => { validade(!commands.length, "invalid command")},
    (commands) => { validade(!keys.includes(commands[0] as keyof typeof command), "comand don't exists")}
]  

const validMessage = (msg: string) => {
    try {
        const message = JSON.parse(msg) as Message;

        if(message === null || message.msg === null || message.name == null){
            throw new Error()
        }

        return message
    } catch (error) {
        throw new Error("invalid message")
    }
}


const exec = (msg: string) => {
    const message = validMessage(msg);
    
    const comands = toCommand(message.msg);

    validator(comands, validateComand)

    return command[comands[0] as keyof typeof command](comands);
}

const server = createServer((socket) => {
    socket.on("data", (data) => {
        const msg = data.toString()
        console.log(msg)

        try{
            socket.write(exec(msg))
        }
        catch(erro){
            const err = erro as Error
            socket.write(err.message)
        }

        // try {
        //     sockets.list.filter(_socket => {
        //         return socket !== _socket
        //     })
        //     .forEach((_socket, index, arr) => {
        //         _socket.write(data)
        //         _socket.resume()
        //     })
        // } catch (error) {
            
        // }
    })

    const close = () => {
        sockets.list = sockets.list.filter(_soket => socket !== _soket)
        socket.destroy()
    }

    ["close", "end", "error"].forEach(
        oper => {
            socket.on(oper, close)
        }
    )

    socket.pipe(socket)
    sockets.list = [...sockets.list, socket]
})

server.listen(1337, `127.0.0.1`)