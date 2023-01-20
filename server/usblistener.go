package server

import (
	"fmt"
	"time"

	"github.com/Aapeli123/usb-stick-writer/usbtools"
)

func difference(a, b []string) []string {
	mb := make(map[string]struct{}, len(b))
	for _, x := range b {
		mb[x] = struct{}{}
	}
	var diff []string
	for _, x := range a {
		if _, found := mb[x]; !found {
			diff = append(diff, x)
		}
	}
	return diff
}

func ListenForUsbs() {
	currentUSBs := []string{}
	for {
		newUsbs := usbtools.GetUSBSticks()
		connected := difference(newUsbs, currentUSBs)
		disconnected := difference(currentUSBs, newUsbs)
		if len(connected) != 0 || len(disconnected) != 0 {
			Broadcast(WsMessage{
				Op: "usbchange",
				Body: MsgBody{
					USBEvent: UsbEvent{
						Connected: newUsbs,
					},
				},
			})
			currentUSBs = newUsbs
			fmt.Println("USBs connected currently ", len(currentUSBs))
		}
		time.Sleep(time.Millisecond * 300)

	}

}
