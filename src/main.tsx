import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { store } from './app/store'
import App from './App'

// Один раз чистим старые данные
const STORAGE_VERSION = '1'
if (localStorage.getItem('app_version') !== STORAGE_VERSION) {
    localStorage.clear()
    localStorage.setItem('app_version', STORAGE_VERSION)
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <Provider store={store}>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </Provider>
)