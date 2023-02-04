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
    Progress: {
      Progress: number;
      ETA: number;
    };
  };
}

interface prog {
  prog: {
    Progress: number;
    ETA: number;
  };
  ready: boolean;
  dest: string;
  error: boolean;
}

export function App() {
  const [connection, setConnection] = useState<WebSocket | null>(null);
  const [usbs, setUsbs] = useState<prog[]>(() => []);
  const [err, setErr] = useState(false);
  const removeUSB = (dest: string) => {
    setUsbs(
      produce((draft) => {
        draft.forEach((usb, i) => {
          if (usb.dest == dest) {
            draft.splice(i, 1);
          }
        });
      })
    );
  };

  const onMsg = (ev: MessageEvent) => {
    const msg = JSON.parse(ev.data) as WsMsg;

    switch (msg.Op) {
      case "usbchange":
        console.log("USB state has changed.");
        setUsbs(
          produce((draft) => {
            if (msg.Body.USBEvent.Connected === null) {
              return;
            }
            const connected = msg.Body.USBEvent.Connected;
            console.log("New state:");
            console.log(connected);
            const newConns = connected
              .filter((usb) => !draft.map((u) => u.dest).includes(usb))
              .map((u) => {
                return {
                  prog: { Progress: 0, ETA: 0 },
                  ready: false,
                  dest: u,
                  error: false,
                };
              });
            const newConnsOverErr = connected.filter((usb) =>
              draft.filter((u) => u.error).find((u) => u.dest == usb)
            );
            const removed = draft
              .map((u) => u.dest)
              .filter((u) => !connected.includes(u));
            draft.forEach((u, i) => {
              if (removed.includes(u.dest)) {
                console.log(draft[i].ready);
                if (draft[i].prog.Progress === 0 || draft[i].ready) {
                  draft.splice(i, 1);
                } else {
                  draft[i].error = true;
                }
              }
              if (newConnsOverErr.includes(u.dest)) {
                draft.splice(i, 1);
              }
            });
            newConns.push(
              ...newConnsOverErr.map((dest) => {
                return {
                  prog: { Progress: 0, ETA: 0 },
                  ready: false,
                  dest: dest,
                  error: false,
                };
              })
            );
            draft.push(...newConns);
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
      setErr(false);
      conn.addEventListener("message", onMsg);
      conn.addEventListener("close", () => {
        setConnection(null);
        connect();
      });
      setConnection(conn);
    } catch (err) {
      setErr(true);
      console.log(err);
      setTimeout(() => connect(), 1000);
    }
  };

  useEffect(() => {
    if (connection === null) connect();
  }, []);
  if (err) {
    return (
      <>
        <h1>
          Virhe tikkujen kirjoituspalvelimeen yhdistäessä, yritetään pian
          uudestaan
        </h1>
      </>
    );
  }
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
              error={u.error}
              startUpdate={startUpdate}
              key={u.dest}
              remove={() => removeUSB(u.dest)}
            />
          );
        })}
      </div>
    </>
  );
}
