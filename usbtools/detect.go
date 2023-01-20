package usbtools

import (
	"fmt"
	"os"
	"path/filepath"
	"regexp"
)

func GetUSBSticks() []string {
	usbSticks := []string{}
	usbregex := regexp.MustCompile("usb")
	blockdirs, _ := os.ReadDir("/sys/block")
	for _, bd := range blockdirs {
		check_pth := fmt.Sprintf("/sys/block/%s/device", bd.Name())
		res, err := filepath.EvalSymlinks(check_pth)
		if err != nil {
			continue
		}
		path := filepath.Join(check_pth, res)
		if err != nil {
			continue
		}
		if !usbregex.Match([]byte(path)) {
			continue
		}
		devPath := fmt.Sprintf("/dev/%s", bd.Name())
		usbSticks = append(usbSticks, devPath)
	}
	return usbSticks
}
