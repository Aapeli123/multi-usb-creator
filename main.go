package main

import (
	"fmt"

	"github.com/Aapeli123/usb-stick-writer/server"
)

func main() {
	fmt.Println("Starting Jedatehdas 1.1")
	go server.ListenForUsbs()
	server.StartServer()

}
