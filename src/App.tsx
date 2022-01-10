import React from 'react';
import {BrowserRouter, Route, Routes} from 'react-router-dom';
import './App.css';
import MainLayout from './pages/MainLayout';
import {DatasetsPage} from './pages/DatasetsPage';
import {EntryErrorPage} from './pages/EntryErrorPage';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path='/' element={<MainLayout contents={<DatasetsPage/>}/>}/>
                <Route path='/entryError' element={<EntryErrorPage/>} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
