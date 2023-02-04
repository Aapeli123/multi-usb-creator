import { useEffect, useState } from "preact/hooks";

const UsbContainer = (props: {
  startUpdate: (dest: string) => any;
  prog: { Progress: number; ETA: number };
  dest: string;
  ready: boolean;
  error: boolean;
  remove: () => any;
}) => {
  useEffect(() => {
    if (props.error === false) {
      setUpdateClicked(false);
    }
  }, [props.error]);
  const [clickedUpdate, setUpdateClicked] = useState(false);
  return (
    <>
      <div
        className={`usb-container ${props.ready ? "usb-ready" : ""} ${
          props.error ? "usb-error" : ""
        }`}
      >
        {" "}
        <textarea placeholder={"USB-portin numero"}></textarea>
        <br />
        <progress min={0} max={1} value={props.prog.Progress}></progress>{" "}
        <br></br>
        {!props.ready && <h3> {Math.round(props.prog.Progress * 100)}% </h3>}
        {props.prog.Progress === 0 && (
          <button
            disabled={clickedUpdate}
            onClick={() => {
              setUpdateClicked(true);
              props.startUpdate(props.dest);
            }}
          >
            Aloita päivitys
          </button>
        )}
        {props.prog.Progress > 0 && props.prog.Progress < 1 && !props.error && (
          <>
            <h3>Päivitetään</h3>
            <h4>
              Jäljellä: n. {Math.floor(props.prog.ETA / 60)} min{" "}
              {Math.round(props.prog.ETA % 60)} s
            </h4>
          </>
        )}
        {props.error && (
          <>
            <h3 id={"error-text"}>Tapahtui virhe</h3>
            <button id={"error-btn"} onClick={() => props.remove()}>
              Ok
            </button>
          </>
        )}
        {props.ready && <h3>Valmis</h3>}
      </div>
    </>
  );
};

export default UsbContainer;
