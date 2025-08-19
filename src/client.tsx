import { createRoot } from 'react-dom/client'
import ClientApp from './client/ClientApp'
import './index.css'

createRoot(document.getElementById("root")!).render(<ClientApp />);