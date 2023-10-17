import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

declare global {
    interface Window { NODESERVER: any; }
}
window["NODESERVER"] = "http://localhost:3000"

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <App />
)
