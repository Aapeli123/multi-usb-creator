import { useState } from "preact/hooks";

const UsbContainer = (props: {
  startUpdate: (dest: string) => any;
  prog: number;
  dest: string;
  ready: boolean;
}) => {
  const [clickedUpdate, setUpdateClicked] = useState(false);
  return (
    <>
      <div className="usb-container">
        {" "}
        <textarea placeholder={"USB-portin numero"}></textarea>
        <br />
        <progress min={0} max={1} value={props.prog}></progress> <br></br>
        {!props.ready &&<h3> {Math.round(props.prog * 100)}% </h3>}
        {props.prog === 0 && (
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
        {props.prog > 0 && props.prog < 1 && <h3>Päivitetään</h3>}
        {props.ready && <h3>Valmis</h3>}
      </div>
    </>
  );
};

export default UsbContainer;
