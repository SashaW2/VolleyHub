import React, { useState, useEffect } from 'react';
import { FaUser, FaEnvelope, FaPhone, FaVolleyballBall, FaLock, FaUnlock } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import userService from '../../services/userService';
import notificationService from '../../services/notificationService';
import Button from '../../components/common/Button/Button';
import styles from './AdminUsersPage.module.css';

const AdminUsersPage = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [notificationText, setNotificationText] = useState('');
    const [showModal, setShowModal] = useState(false);

    const levelMap = {
        1: 'D1',
        2: 'D2',
        3: 'D3',
        4: 'D4',
        5: 'D4+',
        'D4Plus': 'D4+'
    };

    useEffect(() => { loadUsers(); }, []);

    const loadUsers = async () => {
        try {
            const response = await userService.getAllUsers();
            setUsers(response.users || []);
        } catch (error) {
            console.error('Error loading users:', error);
            alert(error.message);
        }
        finally { setLoading(false); }
    };

    const handleBlockUser = async (userId, isBlocked) => {
        try {
            if (isBlocked) {
                await userService.unblockUser(userId);
            } else {
                await userService.blockUser(userId);
            }
            await loadUsers();
        } catch (error) {
            alert(error.message);
        }
    };

    const handleSendNotification = async () => {
        if (!notificationText.trim()) return;
        try {
            await notificationService.sendToUser(selectedUser.id, notificationText);
            setShowModal(false);
            setNotificationText('');
            alert('Уведомление отправлено');
        } catch (error) {
            alert(error.message);
        }
    };

    const getGameLevelDisplay = (level) => {
        return levelMap[level] || level || 'Не указан';
    };

    if (loading) return <div className={styles.loading}>Загрузка...</div>;

    return (
        <div className={styles.adminUsersPage}>
            <div className={styles.container}>
                <h1 className={styles.title}>Управление пользователями</h1>
                <div className={styles.usersGrid}>
                    {users.map(user => (
                        <div key={user.id} className={styles.userCard}>
                            <div className={styles.userHeader}>
                                <div className={styles.userAvatar}><FaUser /></div>
                                <div className={styles.userName}>{user.name}</div>
                                {user.isBlocked && <div className={styles.blockedBadge}>Заблокирован</div>}
                            </div>
                            <div className={styles.userInfo}>
                                <div className={styles.infoRow}><FaEnvelope /><span>{user.email}</span></div>
                                <div className={styles.infoRow}><FaPhone /><span>{user.phone || 'Не указан'}</span></div>
                                <div className={styles.infoRow}><FaVolleyballBall /><span>{getGameLevelDisplay(user.gameLevel)}</span></div>
                            </div>
                            <div className={styles.userActions}>
                                <Button size="small" variant="outline" onClick={() => { setSelectedUser(user); setShowModal(true); }}>
                                    Уведомление
                                </Button>
                                <Button
                                    size="small"
                                    variant={user.isBlocked ? 'success' : 'danger'}
                                    onClick={() => handleBlockUser(user.id, user.isBlocked)}
                                >
                                    {user.isBlocked ? <><FaUnlock /> Разблокировать</> : <><FaLock /> Заблокировать</>}
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
                {users.length === 0 && <div className={styles.emptyState}>Нет пользователей</div>}
            </div>
            {showModal && (
                <div className={styles.modal} onClick={() => setShowModal(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <h3>Отправить уведомление пользователю {selectedUser?.name}</h3>
                        <textarea
                            className={styles.textarea}
                            rows="4"
                            placeholder="Введите текст уведомления..."
                            value={notificationText}
                            onChange={(e) => setNotificationText(e.target.value)}
                        />
                        <div className={styles.modalActions}>
                            <Button variant="outline" onClick={() => setShowModal(false)}>Отмена</Button>
                            <Button onClick={handleSendNotification}>Отправить</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsersPage;