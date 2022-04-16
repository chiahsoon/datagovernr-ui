import React from 'react';
import {BrowserRouter, Route, Routes} from 'react-router-dom';
import './App.css';
import {DatasetPage} from './pages/DatasetPage';
import {FilePage} from './pages/FilePage';
import {VerifyPage} from './pages/VerifyPage';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path='/' element={<DatasetPage/>}/>
                <Route path='/file' element={<FilePage/>}/>
                <Route path='/verify' element={<VerifyPage/>}/>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
