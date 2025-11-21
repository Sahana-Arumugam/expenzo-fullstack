import React, { useState, useEffect } from 'react';
import API from './api/axios.js';
import { Page, Transaction, Category, Budget, Currency, UserCredentials, UserData, TransactionType } from './types';
import { INITIAL_USERS, INITIAL_ALL_USERS_DATA, NEW_USER_DATA_TEMPLATE, INITIAL_CATEGORIES } from './constants';
import Sidebar from './components/layout/Sidebar';
import AuthPage from './components/pages/AuthPage';
import DashboardPage from './components/pages/DashboardPage';
import TransactionsPage from './components/pages/TransactionsPage';
import BudgetsPage from './components/pages/BudgetsPage';
import SettingsPage from './components/pages/SettingsPage';
import ProfilePage from './components/pages/ProfilePage';
import { AnalyticsIcon, MenuIcon } from './components/ui/Icons';

const MobileNav: React.FC<{ onMenuClick: () => void; currentPage: string; }> = ({ onMenuClick, currentPage }) => (
  <div className="md:hidden bg-white shadow-md p-4 flex items-center justify-between sticky top-0 z-20">
    <button onClick={onMenuClick} className="text-gray-600">
      <MenuIcon className="h-6 w-6" />
    </button>
    <h1 className="text-xl font-bold text-gray-800 capitalize">{currentPage}</h1>
    <div className="w-6"></div>
  </div>
);

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<Page>(Page.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  const [users, setUsers] = useState<UserCredentials[]>(INITIAL_USERS);

  const [allUsersData, setAllUsersData] = useState<{ [email: string]: UserData }>(() => {
    try {
      const stored = localStorage.getItem("allUsersData");
      return stored ? JSON.parse(stored) : INITIAL_ALL_USERS_DATA;
    } catch {
      return INITIAL_ALL_USERS_DATA;
    }
  });

  useEffect(() => {
    localStorage.setItem("allUsersData", JSON.stringify(allUsersData));
  }, [allUsersData]);

  useEffect(() => {
    const remembered = localStorage.getItem("rememberedUser");
    if (remembered && allUsersData[remembered]) {
      setCurrentUser(remembered);
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const modifyUser = (fn: (data: UserData) => UserData) => {
    if (!currentUser) return;
    setAllUsersData(prev => ({
      ...prev,
      [currentUser]: fn(prev[currentUser]),
    }));
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { headers: { Authorization: `Bearer ${token}` } } : null;
  };

  // fetch SERVER expenses
  const fetchExpensesFromServer = async (email: string) => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const res = await API.get(`/expenzo/expenses`, headers);

      const serverExpenses: Transaction[] = res.data.map((e: any) => ({
        id: e._id,
        type: TransactionType.EXPENSE,
        amount: Number(e.amount),
        category: e.category || "Uncategorized",
        date: new Date(e.date).toISOString().split("T")[0],
        description: e.description || "",
        isRecurring: false,
      }));

      setAllUsersData(prev => {
        const existing = prev[email] || NEW_USER_DATA_TEMPLATE;
        const localIncome = existing.transactions.filter(t => t.type === TransactionType.INCOME);

        return {
          ...prev,
          [email]: {
            ...existing,
            transactions: [...serverExpenses, ...localIncome],
          },
        };
      });
    } catch (err) {
      console.error("Failed to fetch expenses:", err);
    }
  };

  // ADD transaction
  const addTransaction = (transaction: Omit<Transaction, "id">) => {
    (async () => {
      const headers = getAuthHeaders();

      if (headers && transaction.type === TransactionType.EXPENSE) {
        try {
          const res = await API.post(
            `/expenzo/expenses`,
            {
              amount: transaction.amount,
              category: transaction.category,
              description: transaction.description,
              date: transaction.date,
            },
            headers
          );

          const newT: Transaction = { ...transaction, id: res.data._id };
          modifyUser(data => ({
            ...data,
            transactions: [newT, ...data.transactions],
          }));
          return;
        } catch (err) {
          console.error("Server save failed:", err);
        }
      }

      const newLocal = { ...transaction, id: `t-${Date.now()}` };
      modifyUser(data => ({
        ...data,
        transactions: [newLocal, ...data.transactions],
      }));
    })();
  };

  // DELETE transaction
  const deleteTransaction = (id: string) => {
    (async () => {
      const headers = getAuthHeaders();

      if (headers && !id.startsWith("t-")) {
        try {
          await API.delete(`/expenzo/expenses/${id}`, headers);
        } catch (err) {
          console.error("Failed server delete:", err);
        }
      }

      modifyUser(data => ({
        ...data,
        transactions: data.transactions.filter(t => t.id !== id),
      }));
    })();
  };

  const updateTransaction = (id: string, updated: Omit<Transaction, "id">) => {
    modifyUser(data => ({
      ...data,
      transactions: data.transactions.map(t => (t.id === id ? { ...updated, id } : t)),
    }));
  };

  const addBudget = (budget: Omit<Budget, "id">) => {
    const newBudget = { ...budget, id: `b-${Date.now()}` };
    modifyUser(data => ({
      ...data,
      budgets: [...data.budgets, newBudget],
    }));
  };

  const updateBudget = (id: string, updated: Omit<Budget, "id">) => {
    modifyUser(data => ({
      ...data,
      budgets: data.budgets.map(b => (b.id === id ? { ...updated, id } : b)),
    }));
  };

  const deleteBudget = (id: string) => {
    modifyUser(data => ({
      ...data,
      budgets: data.budgets.filter(b => b.id !== id),
    }));
  };

  const setCurrency = (currency: Currency) => {
    modifyUser(data => ({
      ...data,
      currency,
    }));
  };

  const updateProfile = (fullName: string, avatar: string) => {
    modifyUser(data => ({
      ...data,
      fullName,
      avatar,
    }));
  };

  const addUser = (newUser: UserCredentials) => {
    setUsers(prev => [...prev, newUser]);

    if (!allUsersData[newUser.email]) {
      setAllUsersData(prev => ({
        ...prev,
        [newUser.email]: {
          ...NEW_USER_DATA_TEMPLATE,
          categories: [...INITIAL_CATEGORIES],
          fullName: newUser.email.split("@")[0],
          createdAt: new Date().toISOString(),
        },
      }));
    }
  };

  const handleLogin = (email: string) => {
    if (!allUsersData[email]) {
      addUser({ email, password: "" });
    }
    setCurrentUser(email);
    setIsAuthenticated(true);

    fetchExpensesFromServer(email);
  };

  const handleLogout = () => {
    localStorage.removeItem("rememberedUser");
    setCurrentUser(null);
    setIsAuthenticated(false);
    setCurrentPage(Page.DASHBOARD);
  };

  const currentUserData = currentUser ? allUsersData[currentUser] : null;

  const renderPage = () => {
    if (!currentUserData) return null;

    switch (currentPage) {
      case Page.DASHBOARD:
        return (
          <DashboardPage
            transactions={currentUserData.transactions}
            currency={currentUserData.currency}
            addTransaction={addTransaction}
          />
        );

      case Page.TRANSACTIONS:
        return (
          <TransactionsPage
            transactions={currentUserData.transactions}
            categories={currentUserData.categories}
            currency={currentUserData.currency}
            addTransaction={addTransaction}
            updateTransaction={updateTransaction}
            deleteTransaction={deleteTransaction}
          />
        );

      case Page.BUDGETS:
        return (
          <BudgetsPage
            budgets={currentUserData.budgets}
            transactions={currentUserData.transactions}
            categories={currentUserData.categories}
            currency={currentUserData.currency}
            addBudget={addBudget}
            updateBudget={updateBudget}
            deleteBudget={deleteBudget}
          />
        );

      case Page.PROFILE:
        return (
          <ProfilePage
            userEmail={currentUser!}
            fullName={currentUserData.fullName}
            avatar={currentUserData.avatar}
            updateProfile={updateProfile}
            createdAt={currentUserData.createdAt}
            transactions={currentUserData.transactions}
            currency={currentUserData.currency}
          />
        );

      case Page.SETTINGS:
        return (
          <SettingsPage
            currentCurrency={currentUserData.currency}
            setCurrency={setCurrency}
            transactions={currentUserData.transactions}
            userEmail={currentUser!}
          />
        );

      default:
        return (
          <DashboardPage
            transactions={currentUserData.transactions}
            currency={currentUserData.currency}
            addTransaction={addTransaction}
          />
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center">
        <AnalyticsIcon className="h-12 w-12 text-primary-600 animate-pulse" />
        <p className="text-gray-600 mt-4">Loading expenzo...</p>
      </div>
    );
  }

  if (!isAuthenticated || !currentUserData) {
    return <AuthPage onLoginSuccess={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        logout={handleLogout}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        userName={currentUserData.fullName}
        userAvatar={currentUserData.avatar}
        userEmail={currentUser!}
      />

      <div className="flex-1 flex flex-col md:ml-64">
        <MobileNav
          onMenuClick={() => setIsSidebarOpen(true)}
          currentPage={currentPage}
        />

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">{renderPage()}</main>
      </div>
    </div>
  );
};

export default App;
