package server

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/Aapeli123/usb-stick-writer/usbtools"
	"github.com/google/uuid"
	"nhooyr.io/websocket"
)

var connections map[string]*websocket.Conn = make(map[string]*websocket.Conn)

type UsbEvent struct {
	Connected []string
}

type MsgBody struct {
	USBEvent UsbEvent
	Dest     string
	Progress usbtools.WriteUpdate
}

type WsMessage struct {
	Op   string
	Body MsgBody
}

func handleWs(conn *websocket.Conn) {
	fmt.Println("New connection!")
	id := uuid.New().String()
	connections[id] = conn
	defer delete(connections, id)
	usbs := usbtools.GetUSBSticks()
	jsondata, _ := json.Marshal(&WsMessage{Op: "usbchange", Body: MsgBody{
		USBEvent: UsbEvent{Connected: usbs},
	}})
	conn.Write(context.TODO(), websocket.MessageText, jsondata)
	for {
		msg_type, msg, err := conn.Read(context.TODO())
		if err != nil {
			fmt.Println("Closing connection")
			break
		}
		if msg_type != websocket.MessageText {
			continue
		}
		msg_parsed := WsMessage{}
		err = json.Unmarshal(msg, &msg_parsed)
		if err != nil {
			break
		}

		switch msg_parsed.Op {
		case "start":
			channel := make(chan (usbtools.WriteUpdate))
			go usbtools.Copy("./images/koe.img", msg_parsed.Body.Dest, channel)
			go sendProgress(channel, msg_parsed.Body.Dest)
		}

	}
}

func sendProgress(prog chan (usbtools.WriteUpdate), dest string) {
	for progress := range prog {
		if progress.Error {
			Broadcast(WsMessage{Op: "error", Body: MsgBody{Dest: dest}})
			return
		}
		Broadcast(WsMessage{Op: "prog", Body: MsgBody{Dest: dest, Progress: progress}})
		if progress.Progress == 1 {
			break
		}
	}
	Broadcast(WsMessage{Op: "ready", Body: MsgBody{Dest: dest}})

}

func Broadcast(data WsMessage) {
	msg_bytes, err := json.Marshal(data)
	if err != nil {
		return
	}
	for _, c := range connections {
		err := c.Write(context.TODO(), websocket.MessageText, msg_bytes)
		if err != nil {
			continue
		}
	}
}

func upgradeWs(w http.ResponseWriter, req *http.Request) {
	conn, err := websocket.Accept(w, req, &websocket.AcceptOptions{
		InsecureSkipVerify: true,
	})
	if err != nil {
		fmt.Println(err)
		return
	}
	handleWs(conn)
}

func StartServer() {
	fmt.Println("Server starting...")
	http.HandleFunc("/", upgradeWs)
	http.ListenAndServe(":1234", nil)
}
