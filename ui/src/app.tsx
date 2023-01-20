import { useEffect, useState } from "preact/hooks";
import "./app.css";
import { produce } from "immer";
import UsbContainer from "./UsbContainer";
const establishConn = (server: string) => {
  return new Promise<WebSocket>((res, rej) => {
    const sock = new WebSocket(server);
    sock.onopen = () => res(sock);
    sock.onerror = () => rej("Connection failed");
  });
};

interface WsMsg {
  Op: string;
  Body: {
    USBEvent: {
      Connected: string[] | null;
      Disconnected: string[] | null;
    };
    Dest: string;
    Progress: number;
  };
}

interface prog {
  prog: number;
  ready: boolean;
  dest: string;
}

export function App() {
  const [connection, setConnection] = useState<WebSocket | null>(null);
  const [usbs, setUsbs] = useState<prog[]>(() => [
    { dest: "", prog: 1, ready: true },
  ]);

  const onMsg = (ev: MessageEvent) => {
    const msg = JSON.parse(ev.data) as WsMsg;
    console.log(msg);

    switch (msg.Op) {
      case "usbchange":
        console.log("New usb connected:");
        console.log(usbs);
        setUsbs(
          produce((draft) => {
            console.log(draft);
            console.log(draft.map((u) => u.dest));
            if (msg.Body.USBEvent.Connected === null) {
              return;
            }
            const connected = msg.Body.USBEvent.Connected;
            console.log(connected);
            const newConns = connected
              .filter((usb) => !draft.map((u) => u.dest).includes(usb))
              .map((u) => {
                return {
                  prog: 0,
                  ready: false,
                  dest: u,
                };
              });
            const removed = draft
              .map((u) => u.dest)
              .filter((u) => !connected.includes(u));
            console.log(removed);
            console.log(newConns);
            draft.forEach((u, i) => {
              if (removed.includes(u.dest)) {
                draft.splice(i, 1);
              }
            });
            draft.push(...newConns);
            console.log(draft);
          })
        );
        break;
      case "prog":
        setUsbs(
          produce((draft) => {
            const usb_names = draft.map((u) => u.dest);
            draft[usb_names.indexOf(msg.Body.Dest)].prog = msg.Body.Progress;
          })
        );
        console.log(
          `Updating ${msg.Body.Dest}. Progress ${msg.Body.Progress * 100}%`
        );
        break;
      case "ready": {
        setUsbs(
          produce((draft) => {
            const usb_names = draft.map((u) => u.dest);
            draft[usb_names.indexOf(msg.Body.Dest)].ready = true;
          })
        );
        break;
      }
    }
  };

  const startUpdate = (dest: string) => {
    connection?.send(
      JSON.stringify({
        Op: "start",
        Body: {
          Dest: dest,
        },
      })
    );
  };

  const connect = async () => {
    try {
      const conn = await establishConn("ws://localhost:1234");
      conn.addEventListener("message", onMsg);
      setConnection(conn);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    if (connection === null) connect();
  }, []);
  return connection === null ? (
    <h1>Connecting</h1>
  ) : (
    <>
      <h1>Jedatehdas</h1>
      <h2>(Koetikkujen päivittäjä)</h2>
      {usbs.length === 0 && (
        <>
          <h2 style={"font-weight: 100"}>
            <i>
              Koneessa ei ole yhtään tikkua kiinni. Kun USB-tikku kytketään
              koneeseen se ilmestyy tähän
            </i>
          </h2>
        </>
      )}
      <div className="upgrades">
        {usbs.map((u) => {
          return (
            <UsbContainer
              dest={u.dest}
              prog={u.prog}
              ready={u.ready}
              startUpdate={startUpdate}
              key={u.dest}
            />
          );
        })}
      </div>
    </>
  );
}
