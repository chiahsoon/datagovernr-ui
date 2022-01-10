import React from 'react';
import {Layout, Menu, Typography} from 'antd';
const {Header, Content} = Layout;
const {Text} = Typography;

interface PageContentProps {
    contents: React.ReactNode
}

const MainLayout = (pageContents: PageContentProps) => {
    const {contents} = pageContents;
    return (
        <Layout style={{minHeight: '100vh'}}>
            <Header>
                <Text style={{color: 'white'}}>DataGovernR</Text>
                <Menu theme="dark" mode="horizontal" />
            </Header>
            <Content>
                <div style={{padding: '1em'}}>
                    {contents}
                </div>
            </Content>
        </Layout>
    );
};

export default MainLayout;
