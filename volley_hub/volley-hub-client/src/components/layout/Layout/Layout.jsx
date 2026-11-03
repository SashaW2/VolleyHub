import React from 'react';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import CreatorModal from '../../common/CreatorModal/CreatorModal';
import styles from './Layout.module.css';

const Layout = ({ children }) => {
    return (
        <div className={styles.layout}>
            <Header />
            <main className={styles.main}>
                {children}
            </main>
            <Footer />
            <CreatorModal />
        </div>
    );
};

export default Layout;