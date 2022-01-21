import React from 'react';
import {Layout, Menu, Typography} from 'antd';
const {Header, Content} = Layout;
const {Text} = Typography;

interface MainLayoutProps {
    name: string,
    children: React.ReactNode;
}

// props.children is a special prop that gets rendered in between the tags
const MainLayout = (props: MainLayoutProps) => {
    const {name, children} = props;
    return (
        <Layout style={{minHeight: '100vh', background: 'white'}} >
            <Header>
                <Text style={{color: 'white'}}>{name}</Text>
                <Menu theme="dark" mode="horizontal" />
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
