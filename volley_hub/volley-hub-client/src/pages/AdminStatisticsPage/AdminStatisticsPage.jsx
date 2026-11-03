import React, { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaChartBar, FaMoneyBillWave, FaCalendarAlt, FaUsers, FaBan } from 'react-icons/fa';
import adminService from '../../services/adminService';
import styles from './AdminStatisticsPage.module.css';

const AdminStatisticsPage = () => {
    const [statistics, setStatistics] = useState({
        mostPopularAddress: 'Загрузка...',
        mostPopularLevel: 'Загрузка...',
        averageCost: 'Загрузка...',
        adsLastMonth: 0,
        totalUsers: 0,
        blockedUsers: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadStatistics(); }, []);

    const loadStatistics = async () => {
        try {
            const response = await adminService.getStatistics();
            const stats = response.statistics;

            setStatistics({
                mostPopularAddress: stats.mostPopularAddress,
                mostPopularLevel: stats.mostPopularLevel,
                averageCost: stats.averageCost,
                adsLastMonth: stats.adsLastMonth,
                totalUsers: stats.totalUsers,
                blockedUsers: stats.blockedUsers
            });
        } catch (error) {
            console.error('Error loading statistics:', error);
        }
        finally { setLoading(false); }
    };

    const stats = [
        { icon: <FaMapMarkerAlt />, title: 'Самая популярная площадка', value: statistics.mostPopularAddress, color: '#667eea' },
        { icon: <FaChartBar />, title: 'Популярный уровень', value: statistics.mostPopularLevel, color: '#10B981' },
        { icon: <FaMoneyBillWave />, title: 'Средняя стоимость', value: statistics.averageCost, color: '#F59E0B' },
        { icon: <FaCalendarAlt />, title: 'Объявлений за месяц', value: statistics.adsLastMonth, color: '#3B82F6' },
        { icon: <FaUsers />, title: 'Всего пользователей', value: statistics.totalUsers, color: '#8B5CF6' },
        { icon: <FaBan />, title: 'Заблокировано', value: statistics.blockedUsers, color: '#EF4444' }
    ];

    if (loading) return <div className={styles.loading}>Загрузка статистики...</div>;

    return (
        <div className={styles.statisticsPage}>
            <div className={styles.container}>
                <h1 className={styles.title}>Статистика</h1>
                <div className={styles.statsGrid}>
                    {stats.map((stat, index) => (
                        <div key={index} className={styles.statCard}>
                            <div className={styles.statIcon} style={{ background: stat.color }}>{stat.icon}</div>
                            <div className={styles.statContent}>
                                <div className={styles.statTitle}>{stat.title}</div>
                                <div className={styles.statValue}>{stat.value}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdminStatisticsPage;