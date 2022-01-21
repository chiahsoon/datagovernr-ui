import React from 'react';
import {BrowserRouter, Route, Routes} from 'react-router-dom';
import './App.css';
import {DatasetsPage} from './pages/DatasetsPage';
import {FilePage} from './pages/FilePage';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path='/' element={<DatasetsPage/>}/>
                <Route path='/file' element={<FilePage/>}/>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
