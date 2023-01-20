package main

import (
	"github.com/Aapeli123/usb-stick-writer/server"
)

func main() {
	go server.ListenForUsbs()
	server.StartServer()

}
