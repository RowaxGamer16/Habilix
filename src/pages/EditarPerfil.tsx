import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonToast,
  IonLoading,
  IonAvatar,
  IonIcon,
  IonText,
  IonBackButton,
  IonButtons
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { camera, saveOutline, closeOutline } from 'ionicons/icons';
import './EditarPerfil.css';

interface UserProfile {
  ID: number;
  NOMBRE_USUARIO: string;
  EMAIL: string;
  TELEFONO?: string;
}

interface ValidationError {
  field: string;
  message: string;
}

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const EditarPerfil: React.FC = () => {
  const [userData, setUserData] = useState<UserProfile>({
    ID: 0,
    NOMBRE_USUARIO: '',
    EMAIL: '',
    TELEFONO: ''
  });
  const [tempUserData, setTempUserData] = useState<UserProfile>({
    ID: 0,
    NOMBRE_USUARIO: '',
    EMAIL: '',
    TELEFONO: ''
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [avatarPreview, setAvatarPreview] = useState('');
  const history = useHistory();

  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        history.push('/login');
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/usuario`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Error al obtener perfil');
        }

        const data = await response.json();
        
        if (!data.usuario) {
          throw new Error('Datos de usuario no encontrados');
        }

        const userProfile = {
          ID: data.usuario.ID,
          NOMBRE_USUARIO: data.usuario.NOMBRE_USUARIO,
          EMAIL: data.usuario.EMAIL,
          TELEFONO: data.usuario.TELEFONO || ''
        };

        setUserData(userProfile);
        setTempUserData(userProfile);

        setAvatarPreview(
          `https://ui-avatars.com/api/?name=${encodeURIComponent(data.usuario.NOMBRE_USUARIO)}&background=random`
        );

      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [history]);

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setTempUserData(prev => ({
      ...prev,
      [field]: value
    }));
    // Limpiar error del campo cuando el usuario escribe
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setFieldErrors({});
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay sesión activa');
      }

      // Preparar los datos para enviar al backend
      const updateData: any = {};
      if (tempUserData.NOMBRE_USUARIO !== userData.NOMBRE_USUARIO) {
        updateData.NOMBRE_USUARIO = tempUserData.NOMBRE_USUARIO;
      }
      if (tempUserData.TELEFONO !== userData.TELEFONO) {
        updateData.TELEFONO = tempUserData.TELEFONO || '';
      }

      // Si no hay cambios, no hacer la petición
      if (Object.keys(updateData).length === 0) {
        setSuccess('No se detectaron cambios para actualizar');
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/usuario/actualizar`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          // Manejar errores de validación
          const newFieldErrors: Record<string, string> = {};
          data.errors.forEach((err: ValidationError) => {
            newFieldErrors[err.field] = err.message;
          });
          setFieldErrors(newFieldErrors);
          throw new Error('Por favor corrige los errores en el formulario');
        }
        throw new Error(data.error || 'Error al actualizar perfil');
      }

      // Actualizar los datos del usuario con la respuesta del servidor
      setUserData(data.usuario);
      setTempUserData(data.usuario);
      
      // Actualizar el avatar con el nuevo nombre si cambió
      if (updateData.NOMBRE_USUARIO) {
        setAvatarPreview(
          `https://ui-avatars.com/api/?name=${encodeURIComponent(data.usuario.NOMBRE_USUARIO)}&background=random`
        );
      }

      setSuccess('Perfil actualizado correctamente');
      setTimeout(() => history.push('/perfil'), 1500);

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al actualizar';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    history.push('/perfil');
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/perfil" />
          </IonButtons>
          <IonTitle>Editar Perfil</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonLoading isOpen={isLoading} message="Cargando..." />
        
        <form onSubmit={handleSubmit}>
          <div className="avatar-edit-container">
            <IonAvatar className="profile-avatar">
              <img src={avatarPreview} alt="Avatar" />
            </IonAvatar>
          </div>

          <IonItem>
            <IonLabel position="floating">Nombre de usuario</IonLabel>
            <IonInput
              type="text"
              value={tempUserData.NOMBRE_USUARIO}
              onIonChange={e => handleInputChange('NOMBRE_USUARIO', e.detail.value!)}
              required
              className={fieldErrors.NOMBRE_USUARIO ? 'ion-invalid' : ''}
            />
            {fieldErrors.NOMBRE_USUARIO && (
              <IonText color="danger" className="ion-padding-start">
                <small>{fieldErrors.NOMBRE_USUARIO}</small>
              </IonText>
            )}
          </IonItem>

          <IonItem>
            <IonLabel position="floating">Correo electrónico</IonLabel>
            <IonInput
              type="email"
              value={tempUserData.EMAIL}
              onIonChange={e => handleInputChange('EMAIL', e.detail.value!)}
              required
              disabled
            />
          </IonItem>

          <IonItem>
            <IonLabel position="floating">Teléfono</IonLabel>
            <IonInput
              type="tel"
              value={tempUserData.TELEFONO || ''}
              onIonChange={e => handleInputChange('TELEFONO', e.detail.value!)}
              className={fieldErrors.TELEFONO ? 'ion-invalid' : ''}
            />
            {fieldErrors.TELEFONO && (
              <IonText color="danger" className="ion-padding-start">
                <small>{fieldErrors.TELEFONO}</small>
              </IonText>
            )}
          </IonItem>

          <div className="form-actions">
            <IonButton
              type="button"
              fill="outline"
              color="medium"
              onClick={handleCancel}
            >
              <IonIcon icon={closeOutline} slot="start" />
              Cancelar
            </IonButton>
            <IonButton
              type="submit"
              color="primary"
              disabled={JSON.stringify(userData) === JSON.stringify(tempUserData)}
            >
              <IonIcon icon={saveOutline} slot="start" />
              Guardar cambios
            </IonButton>
          </div>
        </form>

        <IonToast
          isOpen={!!error}
          message={error}
          duration={4000}
          color="danger"
          onDidDismiss={() => setError('')}
          buttons={[{ text: 'OK', role: 'cancel' }]}
        />

        <IonToast
          isOpen={!!success}
          message={success}
          duration={1500}
          color="success"
          onDidDismiss={() => setSuccess('')}
        />
      </IonContent>
    </IonPage>
  );
};

export default EditarPerfil;