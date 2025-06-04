import ClientsList from "./components/ClientsList";
import { ToastContainer, toast } from "react-toastify";
import "./App.css";

function App() {
  return (
    <div>
      <ClientsList />
      <ToastContainer />
      {/* <ClickSend/> */}
    </div>
  );
}

export default App;
