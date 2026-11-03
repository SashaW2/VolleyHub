-- =====================================================
-- База данных: VolleyHub
-- =====================================================

-- Создание базы данных
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'VolleyHub')
BEGIN
    CREATE DATABASE VolleyHub;
END
GO

USE VolleyHub;
GO

-- =====================================================
-- Таблица 1: Users (пользователи системы)
-- =====================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Users]') AND type in (N'U'))
BEGIN
    CREATE TABLE Users (
        Id INT PRIMARY KEY IDENTITY(1,1),
        Name VARCHAR(100) NOT NULL,
        Email VARCHAR(100) UNIQUE NOT NULL,
        Phone VARCHAR(20) NULL,
        GameLevel INT NOT NULL DEFAULT 1,
        Password VARCHAR(255) NOT NULL,
        Language VARCHAR(10) NOT NULL DEFAULT 'ru',
        Theme VARCHAR(20) NOT NULL DEFAULT 'light',
        IsBlocked BIT NOT NULL DEFAULT 0,
        CreatedAt DATETIME DEFAULT GETDATE()
    );
END
GO

-- =====================================================
-- Таблица 2: Roles (роли пользователей)
-- =====================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Roles]') AND type in (N'U'))
BEGIN
    CREATE TABLE Roles (
        Id INT PRIMARY KEY IDENTITY(1,1),
        Name VARCHAR(50) NOT NULL UNIQUE
    );
END
GO

-- Вставляем роли (только если их нет)
IF NOT EXISTS (SELECT * FROM Roles WHERE Name = 'user')
    INSERT INTO Roles (Name) VALUES ('user');
GO

IF NOT EXISTS (SELECT * FROM Roles WHERE Name = 'admin')
    INSERT INTO Roles (Name) VALUES ('admin');
GO

-- Добавляем колонку RoleId в таблицу Users (если её нет)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Users]') AND name = 'RoleId')
BEGIN
    ALTER TABLE Users ADD RoleId INT NOT NULL DEFAULT 1;
    
    -- Добавляем внешний ключ
    ALTER TABLE Users ADD CONSTRAINT FK_Users_RoleId FOREIGN KEY (RoleId) REFERENCES Roles(Id);
END
GO

-- Создаем админа (пароль: admin123, хеш $2a$10$rq8VVZqHkZqHkZqHkZqHku)
IF NOT EXISTS (SELECT * FROM Users WHERE Email = 'admin@volleyhub.com')
BEGIN
    INSERT INTO Users (Name, Email, Phone, GameLevel, Password, Language, Theme, IsBlocked, RoleId)
    VALUES ('Admin', 'admin@volleyhub.com', NULL, 1, '$2a$10$rq8VVZqHkZqHkZqHkZqHku', 'ru', 'light', 0, 2);
END
GO

-- =====================================================
-- Таблица 3: Adverts (объявления об играх)
-- =====================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Adverts]') AND type in (N'U'))
BEGIN
    CREATE TABLE Adverts (
        Id INT PRIMARY KEY IDENTITY(1,1),
        Address VARCHAR(255) NOT NULL,
        Date VARCHAR(10) NOT NULL,
        StartTime TIME NOT NULL,
        EndTime TIME NOT NULL,
        GameLevel INT NOT NULL,
        Cost DECIMAL(10,2) NOT NULL DEFAULT 0,
        PeopleCount INT NOT NULL,
        Description TEXT NULL,
        UserId INT NOT NULL,
        CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
        TwoHourNotificationSent BIT NOT NULL DEFAULT 0,
        FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE
    );
END
GO

-- =====================================================
-- Таблица 4: AdvertParticipants (участники объявлений)
-- =====================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[AdvertParticipants]') AND type in (N'U'))
BEGIN
    CREATE TABLE AdvertParticipants (
        Id INT PRIMARY KEY IDENTITY(1,1),
        AdvertId INT NOT NULL,
        UserId INT NOT NULL,
        JoinedAt DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT UQ_AdvertParticipant UNIQUE (AdvertId, UserId),
        FOREIGN KEY (AdvertId) REFERENCES Adverts(Id) ON DELETE CASCADE,
        FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE NO ACTION
    );
END
GO

-- =====================================================
-- Таблица 5: AdvertSubscribers (подписчики объявлений)
-- =====================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[AdvertSubscribers]') AND type in (N'U'))
BEGIN
    CREATE TABLE AdvertSubscribers (
        Id INT PRIMARY KEY IDENTITY(1,1),
        AdvertId INT NOT NULL,
        UserId INT NOT NULL,
        SubscribedAt DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT UQ_AdvertSubscriber UNIQUE (AdvertId, UserId),
        FOREIGN KEY (AdvertId) REFERENCES Adverts(Id) ON DELETE CASCADE,
        FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE NO ACTION
    );
END
GO

-- =====================================================
-- Таблица 6: Notifications (уведомления пользователей)
-- =====================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Notifications]') AND type in (N'U'))
BEGIN
    CREATE TABLE Notifications (
        Id INT PRIMARY KEY IDENTITY(1,1),
        UserId INT NOT NULL,
        Text TEXT NOT NULL,
        CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
        IsRead BIT NOT NULL DEFAULT 0,
        NotificationType VARCHAR(50) NULL DEFAULT 'system',
        FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE NO ACTION
    );
END
GO

-- =====================================================
-- Индексы для оптимизации запросов
-- =====================================================

-- Индексы для таблицы Users
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Users_Email' AND object_id = OBJECT_ID('Users'))
    CREATE INDEX IX_Users_Email ON Users(Email);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Users_GameLevel' AND object_id = OBJECT_ID('Users'))
    CREATE INDEX IX_Users_GameLevel ON Users(GameLevel);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Users_IsBlocked' AND object_id = OBJECT_ID('Users'))
    CREATE INDEX IX_Users_IsBlocked ON Users(IsBlocked);
GO

-- Индексы для таблицы Adverts
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Adverts_UserId' AND object_id = OBJECT_ID('Adverts'))
    CREATE INDEX IX_Adverts_UserId ON Adverts(UserId);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Adverts_Date' AND object_id = OBJECT_ID('Adverts'))
    CREATE INDEX IX_Adverts_Date ON Adverts(Date);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Adverts_GameLevel' AND object_id = OBJECT_ID('Adverts'))
    CREATE INDEX IX_Adverts_GameLevel ON Adverts(GameLevel);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Adverts_CreatedDate' AND object_id = OBJECT_ID('Adverts'))
    CREATE INDEX IX_Adverts_CreatedDate ON Adverts(CreatedDate);
GO

-- Индексы для таблицы AdvertParticipants
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_AdvertParticipants_AdvertId' AND object_id = OBJECT_ID('AdvertParticipants'))
    CREATE INDEX IX_AdvertParticipants_AdvertId ON AdvertParticipants(AdvertId);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_AdvertParticipants_UserId' AND object_id = OBJECT_ID('AdvertParticipants'))
    CREATE INDEX IX_AdvertParticipants_UserId ON AdvertParticipants(UserId);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_AdvertParticipants_JoinedAt' AND object_id = OBJECT_ID('AdvertParticipants'))
    CREATE INDEX IX_AdvertParticipants_JoinedAt ON AdvertParticipants(JoinedAt);
GO

-- Индексы для таблицы AdvertSubscribers
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_AdvertSubscribers_AdvertId' AND object_id = OBJECT_ID('AdvertSubscribers'))
    CREATE INDEX IX_AdvertSubscribers_AdvertId ON AdvertSubscribers(AdvertId);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_AdvertSubscribers_UserId' AND object_id = OBJECT_ID('AdvertSubscribers'))
    CREATE INDEX IX_AdvertSubscribers_UserId ON AdvertSubscribers(UserId);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_AdvertSubscribers_SubscribedAt' AND object_id = OBJECT_ID('AdvertSubscribers'))
    CREATE INDEX IX_AdvertSubscribers_SubscribedAt ON AdvertSubscribers(SubscribedAt);
GO

-- Индексы для таблицы Notifications
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Notifications_UserId' AND object_id = OBJECT_ID('Notifications'))
    CREATE INDEX IX_Notifications_UserId ON Notifications(UserId);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Notifications_CreatedDate' AND object_id = OBJECT_ID('Notifications'))
    CREATE INDEX IX_Notifications_CreatedDate ON Notifications(CreatedDate);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Notifications_IsRead' AND object_id = OBJECT_ID('Notifications'))
    CREATE INDEX IX_Notifications_IsRead ON Notifications(IsRead);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Notifications_NotificationType' AND object_id = OBJECT_ID('Notifications'))
    CREATE INDEX IX_Notifications_NotificationType ON Notifications(NotificationType);
GO

-- Таблица уровней игры
CREATE TABLE GameLevels (
    Id INT PRIMARY KEY IDENTITY(1,1),
    Name VARCHAR(10) NOT NULL UNIQUE,
    Value INT NOT NULL UNIQUE
);
GO

-- Вставляем уровни
INSERT INTO GameLevels (Name, Value) VALUES 
('D1', 1),
('D2', 2),
('D3', 3),
('D4', 4),
('D4Plus', 5);
GO