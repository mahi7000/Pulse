import { Fragment, useState } from 'react'
import { Menu, Transition, Dialog } from '@headlessui/react'
import { Menu as MenuIcon, X as CloseIcon, Moon, Sun, User } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  const user = {
    name: 'John Doe',
    email: 'john@example.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
  }

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Habits', href: '/habits' },
    { name: 'Groups', href: '/groups' },
  ]

  const handleLogout = () => {
    logout();
    navigate('/login');
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur-md transition-colors duration-300 dark:bg-gray-900/90">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md animate-pulse">
              <div className="w-6 h-6 bg-white rounded-full animate-float"></div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">Pulse</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Habit Tracker</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5 text-gray-600 dark:text-gray-300" />}
            </button>
            
            <button
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors md:hidden"
              onClick={() => setMobileMenuOpen(true)}
            >
              <MenuIcon className="h-5 w-5 text-gray-700 dark:text-gray-200" />
            </button>

            <Menu as="div" className="relative hidden md:block">
              <Menu.Button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <User className="h-5 w-5 text-gray-700 dark:text-gray-200" />
              </Menu.Button>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none p-1 z-50">
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-200">{user.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                  </div>
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        to="/profile"
                        className={`block px-4 py-2 text-sm rounded ${active ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                      >
                        Profile
                      </Link>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        to="/settings"
                        className={`block px-4 py-2 text-sm rounded ${active ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                      >
                        Settings
                      </Link>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        className={`w-full text-left px-4 py-2 text-sm rounded ${active ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                        onClick={handleLogout}
                      >
                        Sign out
                      </button>
                    )}
                  </Menu.Item>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <Dialog as="div" className="md:hidden" open={mobileMenuOpen} onClose={setMobileMenuOpen}>
        <div className="fixed inset-0 bg-black/30" />
        <Dialog.Panel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white dark:bg-gray-900 px-4 py-4 sm:max-w-sm sm:ring-1 sm:ring-gray-200 dark:sm:ring-gray-700">
          <div className="flex items-center justify-between">
            <Link to="/" className="-m-1.5 p-1.5" onClick={() => setMobileMenuOpen(false)}>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                  <div className="w-6 h-6 bg-white rounded-full"></div>
                </div>
                <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">Pulse</h1>
              </div>
            </Link>
            <button
              type="button"
              className="-m-2.5 rounded-md p-2.5"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
            >
              <CloseIcon className="h-6 w-6 text-gray-700 dark:text-gray-200" />
            </button>
          </div>
          <div className="mt-6 flow-root">
            <div className="-my-6 divide-y divide-gray-200 dark:divide-gray-700">
              <div className="space-y-2 py-6">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="-mx-3 block rounded-lg px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
              <div className="py-6">
                <div className="flex items-center px-3 py-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-700 dark:text-gray-200" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-200">{user.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                  </div>
                </div>
                <div className="mt-2 space-y-1">
                  <Link
                    to="/profile"
                    className="block rounded-lg px-3 py-2 text-base font-medium hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <Link
                    to="/settings"
                    className="block rounded-lg px-3 py-2 text-base font-medium hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Settings
                  </Link>
                  <button
                    className="w-full text-left rounded-lg px-3 py-2 text-base font-medium hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={handleLogout}
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Dialog.Panel>
      </Dialog>
    </header>
  )
}

export default Header
