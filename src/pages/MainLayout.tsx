import React from 'react';
import {Layout, Menu} from 'antd';
import {Link} from 'react-router-dom';
import {getDvParams} from '../types/dataverseParams';
const {Header, Content} = Layout;

interface MainLayoutProps {
    name: string,
    children: React.ReactNode;
}


// props.children is a special prop that gets rendered in between the tags
const MainLayout = (props: MainLayoutProps) => {
    const dvParams = getDvParams();
    const {name, children} = props;
    return (
        <Layout style={{minHeight: '100vh', background: 'white'}} >
            <Header>
                <Link to='/' state={{dvParams}} style={{color: 'white'}}>{name}</Link>
                <Menu theme='dark' mode='horizontal' />
            </Header>
            <Content>
                <div style={{padding: '1em'}}>
                    {children}
                </div>
            </Content>
        </Layout>
    );
};

export default MainLayout;
