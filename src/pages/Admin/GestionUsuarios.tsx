import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonButton,
  IonIcon,
  IonAlert,
  IonToast,
  IonLoading
} from '@ionic/react';
import { copy, trash, create, refresh } from 'ionicons/icons';
import './UsersTable.css';

interface Usuario {
  ID: number;
  NOMBRE_USUARIO: string;
  EMAIL: string;
  TELEFONO?: string;
  FECHA_CREACION: string;
  ROLE: number;
}

const UsersTable: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [usuarioToDelete, setUsuarioToDelete] = useState<number | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const token = localStorage.getItem('token');

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/usuarios', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al obtener los usuarios');
      }

      const data = await response.json();
      setUsuarios(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:5000/api/usuarios/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al eliminar el usuario');
      }

      setUsuarios(usuarios.filter(user => user.ID !== id));
      setToastMessage('Usuario eliminado correctamente');
      setShowToast(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setToastMessage('Copiado al portapapeles');
    setShowToast(true);
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Usuarios</IonTitle>
          <IonButton slot="end" fill="clear" onClick={fetchUsuarios}>
            <IonIcon icon={refresh} />
          </IonButton>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div className="table-container">
          <IonGrid className="users-table">
            <IonRow className="table-header">
              <IonCol>Acciones</IonCol>
              <IonCol>ID</IonCol>
              <IonCol>Nombre</IonCol>
              <IonCol>Email/Usuario</IonCol>
              <IonCol>Rol</IonCol>
              <IonCol>Teléfono</IonCol>
              <IonCol>Fecha Creación</IonCol>
            </IonRow>

            {loading ? (
              <IonRow>
                <IonCol size="12">
                  <IonLoading isOpen={loading} message="Cargando usuarios..." />
                </IonCol>
              </IonRow>
            ) : error ? (
              <IonRow>
                <IonCol size="12">
                  <div className="error-message">{error}</div>
                </IonCol>
              </IonRow>
            ) : (
              usuarios.map(usuario => (
                <IonRow key={usuario.ID} className="table-row">
                  <IonCol>
                    <IonButton
                      fill="clear"
                      size="small"
                      onClick={() => copyToClipboard(usuario.EMAIL || usuario.NOMBRE_USUARIO)}
                    >
                      <IonIcon icon={copy} />
                    </IonButton>
                    <IonButton
                      fill="clear"
                      color="danger"
                      size="small"
                      onClick={() => {
                        setUsuarioToDelete(usuario.ID);
                        setShowDeleteAlert(true);
                      }}
                    >
                      <IonIcon icon={trash} />
                    </IonButton>
                  </IonCol>
                  <IonCol>{usuario.ID}</IonCol>
                  <IonCol>{usuario.NOMBRE_USUARIO}</IonCol>
                  <IonCol>{usuario.EMAIL || usuario.NOMBRE_USUARIO}</IonCol>
                  <IonCol>{usuario.ROLE === 1 ? 'Usuario' : 'Admin'}</IonCol>
                  <IonCol>{usuario.TELEFONO || '-'}</IonCol>
                  <IonCol>{new Date(usuario.FECHA_CREACION).toLocaleString()}</IonCol>
                </IonRow>
              ))
            )}
          </IonGrid>
        </div>

        
        

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
        />
      </IonContent>
    </IonPage>
  );
};

export default UsersTable;