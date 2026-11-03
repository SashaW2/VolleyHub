import React, { useState } from 'react';
import { useCreatorModal } from '../../../context/CreatorModalContext';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import Button from '../../common/Button/Button';
import userService from '../../../services/userService';
import notificationService from '../../../services/notificationService';
import styles from './CreatorModal.module.css';

const CreatorModal = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const { selectedCreator, showModal, closeCreatorModal, updateCreator } = useCreatorModal();
    const [notificationText, setNotificationText] = useState('');

    const isAdminUser = user?.role === 'admin' || user?.isAdmin === true || user?.roleId === 2;

    const levelMap = {
        1: 'D1', 2: 'D2', 3: 'D3', 4: 'D4', 5: 'D4+',
        'D4Plus': 'D4+'
    };

    const getGameLevelDisplay = (level) => {
        return levelMap[level] || level || 'Не указан';
    };

    const handleBlockUser = async () => {
        if (!selectedCreator) return;
        if (window.confirm(`Вы уверены, что хотите ${selectedCreator.isBlocked ? 'разблокировать' : 'заблокировать'} пользователя ${selectedCreator.name}?`)) {
            try {
                if (selectedCreator.isBlocked) {
                    await userService.unblockUser(selectedCreator.id);
                } else {
                    await userService.blockUser(selectedCreator.id);
                }
                const updatedResponse = await userService.getUserById(selectedCreator.id);
                updateCreator(updatedResponse.user);
                alert(`Пользователь ${selectedCreator.isBlocked ? 'разблокирован' : 'заблокирован'}`);
            } catch (err) {
                alert(err.message);
            }
        }
    };

    const handleSendNotification = async () => {
        if (!selectedCreator || !notificationText.trim()) return;
        try {
            await notificationService.sendToUser(selectedCreator.id, notificationText);
            setNotificationText('');
            closeCreatorModal();
            alert('Уведомление отправлено');
        } catch (err) {
            alert(err.message);
        }
    };

    if (!showModal || !selectedCreator) return null;

    return (
        <div className={styles.modal} onClick={closeCreatorModal}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h3>Информация о создателе</h3>
                    <button className={styles.closeBtn} onClick={closeCreatorModal}>×</button>
                </div>
                <div className={styles.creatorInfo}>
                    <p><strong>Имя:</strong> {selectedCreator.name}</p>
                    <p><strong>Email:</strong> {selectedCreator.email}</p>
                    <p><strong>Телефон:</strong> {selectedCreator.phone || 'Не указан'}</p>
                    <p><strong>Уровень игры:</strong> {getGameLevelDisplay(selectedCreator.gameLevel)}</p>
                    <p><strong>Статус:</strong> {selectedCreator.isBlocked ? 'Заблокирован' : 'Активен'}</p>
                </div>
                {isAdminUser && (
                    <>
                        <div className={styles.notificationSection}>
                            <textarea
                                className={styles.textarea}
                                rows="3"
                                placeholder="Введите текст уведомления..."
                                value={notificationText}
                                onChange={(e) => setNotificationText(e.target.value)}
                            />
                        </div>
                        <div className={styles.modalActions}>
                            <Button onClick={handleSendNotification}>Отправить уведомление</Button>
                            <Button
                                variant={selectedCreator.isBlocked ? 'success' : 'danger'}
                                onClick={handleBlockUser}
                            >
                                {selectedCreator.isBlocked ? 'Разблокировать' : 'Заблокировать'}
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default CreatorModal;