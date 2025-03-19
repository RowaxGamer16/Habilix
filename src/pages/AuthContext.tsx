import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

interface AuthContextType {
  isLoggedIn: boolean;
  login: () => void;
  logout: () => void;
  cursos: any[]; // Lista de cursos
  error: string; // Mensaje de error
  isLoading: boolean; // Estado de carga
  fetchCursos: () => Promise<void>; // Función para cargar los cursos
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(!!localStorage.getItem('authToken'));
  const [cursos, setCursos] = useState<any[]>([]); // Estado para almacenar los cursos
  const [error, setError] = useState<string>(''); // Estado para manejar errores
  const [isLoading, setIsLoading] = useState<boolean>(false); // Estado para manejar la carga

  // Función para iniciar sesión
  const login = () => {
    setIsLoggedIn(true);
    localStorage.setItem('authToken', 'your-auth-token');
  };

  // Función para cerrar sesión
  const logout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('authToken');
    setCursos([]); // Limpiar los cursos al cerrar sesión
  };

  // Función para cargar los cursos desde el backend
  const fetchCursos = async () => {
    if (!isLoggedIn) return; // Solo cargar cursos si el usuario está logueado

    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:5000/api/cursos', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error al obtener los cursos');
      }

      const data = await response.json();
      setCursos(data); // Guardar los cursos en el estado
    } catch (error) {
      setError('Error al cargar los cursos');
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar los cursos automáticamente cuando el usuario inicie sesión
  useEffect(() => {
    if (isLoggedIn) {
      fetchCursos();
    }
  }, [isLoggedIn]);

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout, cursos, error, isLoading, fetchCursos }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};