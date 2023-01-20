package usbtools

import (
	"bufio"
	"fmt"
	"io"
	"os"
	"sync"
)

var WG sync.WaitGroup

func Copy(src string, dest string, updates chan<- float32) error {
	fmt.Println("started write to ", dest)
	WG.Add(1)
	defer close(updates)
	defer WG.Done()
	data := make([]byte, 10*1024*1024)
	in, err := os.Open(src)
	if err != nil {
		panic(err)
	}
	reader := bufio.NewReader(in)
	defer in.Close()

	info, err := in.Stat()
	if err != nil {
		panic(err)
	}
	filesize := info.Size()

	out, err := os.OpenFile(dest, os.O_WRONLY, 0644)
	if err != nil {
		return err
	}
	writer := bufio.NewWriter(out)
	defer out.Close()

	total := float32(0)
	for {
		c, err := reader.Read(data)
		if err == io.EOF {
			break
		} else if err != nil {
			return err
		}
		total += float32(c)
		data = data[:c]
		_, err = writer.Write(data)
		if err != nil {
			return err
		}
		fmt.Printf("Updating %s: %f%%\n", dest, 100*total/float32(filesize))

		updates <- float32(total / float32(filesize))
	}
	return nil
}
