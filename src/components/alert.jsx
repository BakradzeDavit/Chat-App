import { useEffect, useState } from "react";
import "./alert.css";

const Alert = ({ message, setAlertMessage }) => {
  const [closing, setClosing] = useState(false);
  const [visible, setVisible] = useState(false); // new

  useEffect(() => {
    if (!message) return;

    setVisible(true); // trigger slide-in

    const timer = setTimeout(() => setClosing(true), 3000); // start slide-out
    return () => clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    if (!closing) return;

    const timer = setTimeout(() => {
      setAlertMessage(""); // remove after animation
      setClosing(false);
      setVisible(false);
    }, 300); // match CSS transition
    return () => clearTimeout(timer);
  }, [closing, setAlertMessage]);

  if (!message && !visible) return null;

  return (
    <div
      className={`alert ${
        closing ? "alert-hide" : visible ? "alert-show" : ""
      }`}
    >
      {message}
    </div>
  );
};

export default Alert;
