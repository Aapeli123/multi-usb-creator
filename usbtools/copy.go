package usbtools

import (
	"bufio"
	"fmt"
	"io"
	"os"
	"sync"
	"time"
)

var WG sync.WaitGroup

type WriteUpdate struct {
	Progress float32
	ETA      float32
	Error    bool
}

func Copy(src string, dest string, updates chan<- WriteUpdate) error {
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
		updates <- WriteUpdate{Error: true}
		return err
	}
	writer := bufio.NewWriter(out)
	defer out.Close()

	total := float32(0)
	for {
		t := time.Now()
		c, err := reader.Read(data)
		if err == io.EOF {
			break
		} else if err != nil {
			updates <- WriteUpdate{Error: true}
			return err
		}
		total += float32(c)
		data = data[:c]
		n, err := writer.Write(data)
		if err != nil {
			updates <- WriteUpdate{Error: true}
			return err
		}
		duration := time.Since(t)

		bps := float64(n) / duration.Seconds()
		bytes_remain := float32(filesize) - total
		eta := bytes_remain / float32(bps)
		fmt.Printf("Updating %s: %f%%\n", dest, 100*total/float32(filesize))

		updates <- WriteUpdate{Progress: total / float32(filesize), ETA: eta}
	}
	return nil
}
