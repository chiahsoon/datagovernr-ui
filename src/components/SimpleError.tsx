import React from 'react';
import {fieldsErrorRedBorder} from '../styles/common';

interface SimpleErrorProps {
    errorMessage: string
}

export const SimpleError = (props: SimpleErrorProps) => {
    const {errorMessage} = props;
    return (
        <div style={{display: errorMessage ? 'block' : 'none', color: fieldsErrorRedBorder}}>
            {errorMessage}
        </div>
    );
};
