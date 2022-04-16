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
const MainLayout: React.FC<MainLayoutProps> = (props) => {
    const dvParams = getDvParams();
    const {name, children} = props;
    return (
        <Layout style={{minHeight: '100vh', background: 'white'}} >
            <Header>
                <Menu theme='dark' mode='horizontal' >
                    <Menu.Item key={'home'}>
                        <Link to='/' state={{dvParams}} style={{color: 'white', fontWeight: 'bold'}}>{name}</Link>
                    </Menu.Item>
                    <Menu.Item key={'verify'}>
                        <Link to='/verify' state={{dvParams}} style={{color: 'white'}}>Verify</Link>
                    </Menu.Item>
                </Menu>
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
