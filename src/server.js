import express from "express";
import cors from "cors";
import dayjs from "dayjs";
import fs from "fs";

const app = express();

app.use(cors());
app.use(express.json());
let data = JSON.parse(fs.readFileSync("./data.json"));
let messages = data.messages
let participants = data.participants
let countId = 0;

function addParticipant(user){
    data.messages.push({
        from: user,
        to: "Todos",
        text: "entra na sala...",
        type: "status",
        time: dayjs().format("HH:mm:ss"),
    });
}

app.get('/participants', (req,res)=>{
    res.send(participants)
});

app.post('/participants',(req,res)=>{
    countId++
    const user = req.body;
    if(user.name === null) return res.status(400).send("Nome vazio!");
    if(user.name.length === 0) return res.status(400).send("Nome vazio!");
    if (participants.find((p) => p.name === user.name)) return res.status(409).send("Esse nome já está sendo utilizado.");
    user.id = countId;
    user.lastStatus = Date.now();
    addParticipant(user.name);
    data.participants.push(user)
    fs.writeFileSync("./data.json", JSON.stringify(data));
    res.sendStatus(200);
});

app.get('/messages', (req,res)=>{
    const limit = +req.query.limit;
    const user = req.headers.user;
    const filteredMessages = data.messages.filter((m) => {
        return (m.type === "message" || m.to === "Todos" || m.to === user || m.from === user);
    });
    const lastMessages = filteredMessages.filter((m,i)=> i > messages.length - limit);
    res.send(lastMessages)
});

app.post('/messages', (req,res)=>{
    const newmessage = req.body;
    newmessage.from = req.headers.user;
    newmessage.time = dayjs().format("HH:mm:ss");
    if(newmessage.to === "") return res.status(400).send("Destinatário não pode estar vazio!");   
    if(newmessage.text === "") return res.status(400).send("Messagem não pode estar vazio!");
    const participant = participants.find((p) => p.name === newmessage.from);
    if(participant){
        data.messages.push(newmessage)
        fs.writeFileSync("./data.json", JSON.stringify(data));
        res.sendStatus(200);
    }else{
        res.sendStatus(400);
    }
});

app.post('/status', (req, res)=>{
    const user = req.headers.user;
    const participant = participants.find((n)=>n.name === user);
    if(participant){
        participant.lastStatus = Date.now();
        res.sendStatus(200);
    } else{
        res.sendStatus(400);
    }
});

setInterval(()=>{
    const now = Date.now();
    data.participants = participants.filter((p)=>{
        if((now - p.lastStatus) > 10000){
            messages.push({
                from: p.name,
                to: "Todos",
                text: "sai da sala...",
                type: "status",
                time: dayjs().format("HH:mm:ss")
            })
            return false
        }
        return true
    })
    participants = data.participants;
    fs.writeFileSync("./data.json", JSON.stringify(data))
}, 15000)

app.listen(4000, ()=>{
    console.log("Server running on port 4000");
});