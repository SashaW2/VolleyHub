import React, { useState, useEffect, useRef } from 'react';
import { FaUser, FaEnvelope, FaPhone, FaVolleyballBall, FaLock, FaUnlock } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import userService from '../../services/userService';
import notificationService from '../../services/notificationService';
import Button from '../../components/common/Button/Button';
import Input from '../../components/common/Input/Input';
import styles from './AdminUsersPage.module.css';

const AdminUsersPage = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [notificationText, setNotificationText] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [sendStatus, setSendStatus] = useState({ type: '', text: '' });

    const [searchEmail, setSearchEmail] = useState('');
    const [emailSuggestions, setEmailSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [allEmails, setAllEmails] = useState([]);
    const wrapperRef = useRef(null);

    const levelMap = {
        1: 'D1',
        2: 'D2',
        3: 'D3',
        4: 'D4',
        5: 'D4+',
        'D4Plus': 'D4+'
    };

    useEffect(() => {
        loadUsers();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const loadUsers = async () => {
        try {
            const response = await userService.getAllUsers();
            const usersList = response.users || [];
            setUsers(usersList);

            const uniqueEmails = [...new Set(usersList.map(u => u.email).filter(Boolean))];
            uniqueEmails.sort();
            setAllEmails(uniqueEmails);
        } catch (error) {
            console.error('Error loading users:', error);
            alert(error.message);
        }
        finally { setLoading(false); }
    };

    const filterEmails = (query) => {
        if (!query.trim()) {
            setEmailSuggestions(allEmails.slice(0, 15));
            return;
        }
        const filtered = allEmails.filter(email =>
            email.toLowerCase().includes(query.toLowerCase())
        );
        setEmailSuggestions(filtered.slice(0, 15));
    };

    const handleEmailChange = (value) => {
        setSearchEmail(value);
        filterEmails(value);
    };

    const handleEmailFocus = () => {
        filterEmails(searchEmail);
        setShowSuggestions(true);
    };

    const handleSelectEmail = (email) => {
        setSearchEmail(email);
        setShowSuggestions(false);
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

    const handleOpenModal = (user) => {
        setSelectedUser(user);
        setNotificationText('');
        setSendStatus({ type: '', text: '' });
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setNotificationText('');
        setSendStatus({ type: '', text: '' });
    };

    const handleSendNotification = async () => {
        if (!notificationText.trim()) return;
        try {
            await notificationService.sendToUser(selectedUser.id, notificationText);
            setSendStatus({ type: 'success', text: 'Уведомление отправлено' });
            setNotificationText('');
            setTimeout(() => {
                handleCloseModal();
            }, 1200);
        } catch (error) {
            setSendStatus({ type: 'error', text: error.message || 'Ошибка отправки' });
        }
    };

    const getGameLevelDisplay = (level) => {
        return levelMap[level] || level || 'Не указан';
    };

    const filteredUsers = searchEmail.trim()
        ? users.filter(u => u.email && u.email.toLowerCase() === searchEmail.toLowerCase())
        : users;

    if (loading) return <div className={styles.loading}>Загрузка...</div>;

    return (
        <div className={styles.adminUsersPage}>
            <div className={styles.container}>
                <h1 className={styles.title}>Управление пользователями</h1>

                <div className={styles.searchSection}>
                    <div className={styles.searchWrapper} ref={wrapperRef}>
                        <Input
                            placeholder="Поиск по логину (email)"
                            value={searchEmail}
                            onChange={(e) => handleEmailChange(e.target.value)}
                            onFocus={handleEmailFocus}
                        />
                        {showSuggestions && emailSuggestions.length > 0 && (
                            <ul className={styles.suggestionsList}>
                                {emailSuggestions.map((email, index) => (
                                    <li
                                        key={index}
                                        className={styles.suggestionItem}
                                        onClick={() => handleSelectEmail(email)}
                                    >
                                        {email}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                <div className={styles.usersGrid}>
                    {filteredUsers.map(user => (
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
                                <Button size="small" variant="outline" onClick={() => handleOpenModal(user)}>
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
                {users.length > 0 && filteredUsers.length === 0 && (
                    <div className={styles.emptyState}>Ничего не найдено</div>
                )}
            </div>
            {showModal && (
                <div className={styles.modal} onClick={handleCloseModal}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <h3>Отправить уведомление пользователю {selectedUser?.name}</h3>
                        <textarea
                            className={styles.textarea}
                            rows="4"
                            placeholder="Введите текст уведомления..."
                            value={notificationText}
                            onChange={(e) => setNotificationText(e.target.value)}
                        />
                        {sendStatus.text && (
                            <div className={`${styles.sendStatus} ${styles[sendStatus.type]}`}>
                                {sendStatus.text}
                            </div>
                        )}
                        <div className={styles.modalActions}>
                            <Button variant="outline" onClick={handleCloseModal}>Отмена</Button>
                            <Button onClick={handleSendNotification}>Отправить</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsersPage;