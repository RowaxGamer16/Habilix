import React, { useEffect, useState, useRef } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonLoading,
  IonToast,
  IonAlert,
  IonImg,
} from '@ionic/react';
import { arrowBack, save } from 'ionicons/icons';
import { useParams, useHistory } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

interface Curso {
  id: number;
  nombre: string;
  descripcion: string;
  portada: string;
  categoria: string;
  precio: number;
  entrega: string;
  horario: string;
  profesor: string;
  id_usuario: number;
}

interface Usuario {
  ID: number;
  NOMBRE_USUARIO: string;
  EMAIL: string;
  ROLE: string;
  TELEFONO?: string;
  FECHA_CREACION?: string;
}

const EditarCurso: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const [curso, setCurso] = useState<Curso | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    categoria: '',
    precio: 0,
    entrega: 'Virtual',
    horario: 'Flexible',
    profesor: '',
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [mostrarToast, setMostrarToast] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [esCreador, setEsCreador] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const token = localStorage.getItem('token');
  const rawUsuario = localStorage.getItem('usuario');
  const usuario: Usuario | null = rawUsuario ? JSON.parse(rawUsuario) : null;

  // Cargar datos del curso
  useEffect(() => {
    const fetchCurso = async () => {
      try {
        if (!token || !id) {
          throw new Error('Token de autenticación o ID de curso no encontrado');
        }

        const response = await fetch(`${API_URL}/cursos/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (!response.ok) {
          throw new Error('Error al obtener el curso');
        }

        const data = await response.json();
        setCurso(data);
        
        setFormData({
          nombre: data.nombre,
          descripcion: data.descripcion,
          categoria: data.categoria,
          precio: data.precio,
          entrega: data.entrega || 'Virtual',
          horario: data.horario || 'Flexible',
          profesor: data.profesor,
        });

        if (usuario) {
          const esCreadorVerificado = Number(usuario.ID) === Number(data.id_usuario);
          setEsCreador(esCreadorVerificado);
          if (!esCreadorVerificado) {
            setError('No tienes permiso para editar este curso');
          }
        }
      } catch (err) {
        console.error('Error al cargar el curso:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar el curso');
      } finally {
        setLoading(false);
      }
    };

    fetchCurso();
  }, [id, token, usuario]);

  const handleInputChange = (field: keyof typeof formData) => 
    (event: CustomEvent | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      let value: string | number;
      
      if ('detail' in event) {
        // Es un evento de Ionic (CustomEvent)
        value = event.detail.value || '';
      } else {
        // Es un evento de React (ChangeEvent)
        value = event.target.value || '';
      }

      // Manejo especial para el campo de precio
      if (field === 'precio') {
        value = Number(value) || 0;
      }

      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };

  const validarFormulario = () => {
    if (!formData.nombre.trim()) {
      setError('El nombre del curso es requerido');
      return false;
    }
    if (!formData.descripcion.trim()) {
      setError('La descripción del curso es requerida');
      return false;
    }
    if (!formData.profesor.trim()) {
      setError('El nombre del profesor es requerido');
      return false;
    }
    if (formData.precio < 0) {
      setError('El precio no puede ser negativo');
      return false;
    }
    return true;
  };

  const guardarCambios = async () => {
    if (!esCreador) {
      setError('No tienes permiso para editar este curso');
      return;
    }

    if (!validarFormulario()) {
      return;
    }

    setSaving(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('nombre', formData.nombre.trim());
      formDataToSend.append('descripcion', formData.descripcion.trim());
      formDataToSend.append('categoria', formData.categoria.trim());
      formDataToSend.append('precio', formData.precio.toString());
      formDataToSend.append('entrega', formData.entrega);
      formDataToSend.append('horario', formData.horario);
      formDataToSend.append('profesor', formData.profesor.trim());
      
      if (selectedImage) {
        formDataToSend.append('portada', selectedImage);
      }

      const response = await fetch(`${API_URL}/cursos/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar el curso');
      }

      const result = await response.json();

      if (result.success) {
        setToastMsg('Curso actualizado correctamente');
        setMostrarToast(true);
        setTimeout(() => {
          history.push(`/curso/${id}`);
        }, 1500);
      } else {
        throw new Error(result.error || 'Error al actualizar el curso');
      }
    } catch (err) {
      console.error('Error al guardar cambios:', err);
      setError(
        err instanceof Error 
          ? err.message 
          : 'Error al guardar los cambios'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <IonLoading isOpen={true} message="Cargando curso..." />
        </IonContent>
      </IonPage>
    );
  }

  if (!curso || !esCreador) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Error</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <p>{error || 'No tienes permiso para editar este curso o el curso no existe.'}</p>
          <IonButton expand="block" onClick={() => history.push('/cursos')}>
            <IonIcon slot="start" icon={arrowBack} />
            Volver a Cursos
          </IonButton>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Editar Curso</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonItem>
          <IonLabel position="floating">Nombre del curso*</IonLabel>
          <IonInput
            value={formData.nombre}
            onIonChange={handleInputChange('nombre')}
            required
          />
        </IonItem>

        <IonItem>
          <IonLabel position="floating">Descripción*</IonLabel>
          <IonTextarea
            value={formData.descripcion}
            onIonChange={handleInputChange('descripcion')}
            rows={4}
            required
          />
        </IonItem>

        <IonItem>
          <IonLabel position="floating">Profesor*</IonLabel>
          <IonInput
            value={formData.profesor}
            onIonChange={handleInputChange('profesor')}
            required
          />
        </IonItem>

        <IonItem>
          <IonLabel position="floating">Categoría</IonLabel>
          <IonInput
            value={formData.categoria}
            onIonChange={handleInputChange('categoria')}
          />
        </IonItem>

        <IonItem>
          <IonLabel position="floating">Precio ($)</IonLabel>
          <IonInput
            type="number"
            value={formData.precio}
            onIonChange={handleInputChange('precio')}
            min="0"
          />
        </IonItem>

        <IonItem>
          <IonLabel>Método de entrega</IonLabel>
          <IonSelect
            value={formData.entrega}
            onIonChange={(e) => handleInputChange('entrega')(e)}
          >
            <IonSelectOption value="Virtual">Virtual</IonSelectOption>
            <IonSelectOption value="Presencial">Presencial</IonSelectOption>
            <IonSelectOption value="Híbrido">Híbrido</IonSelectOption>
          </IonSelect>
        </IonItem>

        <IonItem>
          <IonLabel>Horario</IonLabel>
          <IonSelect
            value={formData.horario}
            onIonChange={(e) => handleInputChange('horario')(e)}
          >
            <IonSelectOption value="Flexible">Flexible</IonSelectOption>
            <IonSelectOption value="Fijo">Fijo</IonSelectOption>
            <IonSelectOption value="Fines de semana">Fines de semana</IonSelectOption>
          </IonSelect>
        </IonItem>

        <IonItem>
          <IonLabel>Imagen del curso</IonLabel>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{ display: 'none' }}
            id="uploadFile"
            ref={fileInputRef}
          />
          <IonButton
            expand="block"
            onClick={() => fileInputRef.current?.click()}
            color="primary"
            fill="outline"
          >
            Seleccionar Imagen
          </IonButton>
          {selectedImage && (
            <p style={{ marginLeft: '16px', marginTop: '8px' }}>
              {selectedImage.name}
            </p>
          )}
          {curso.portada && !selectedImage && (
            <div style={{ marginTop: '10px', textAlign: 'center' }}>
              <IonImg 
                src={`${API_URL}${curso.portada}`}
                alt="Portada actual"
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '200px', 
                  objectFit: 'contain',
                  margin: '0 auto'
                }}
              />
              <p>Imagen actual</p>
            </div>
          )}
        </IonItem>

        <div style={{ marginTop: '20px' }}>
          <IonButton
            expand="block"
            color="primary"
            onClick={guardarCambios}
            disabled={saving}
          >
            <IonIcon slot="start" icon={save} />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </IonButton>

          <IonButton
            expand="block"
            color="medium"
            onClick={() => history.push(`/curso/${id}`)}
            fill="outline"
            style={{ marginTop: '10px' }}
          >
            <IonIcon slot="start" icon={arrowBack} />
            Cancelar
          </IonButton>
        </div>

        <IonLoading isOpen={saving} message="Guardando cambios..." />
        <IonToast
          isOpen={mostrarToast}
          onDidDismiss={() => setMostrarToast(false)}
          message={toastMsg}
          duration={3000}
          color="success"
          position="top"
        />
        <IonAlert
          isOpen={!!error}
          onDidDismiss={() => setError(null)}
          header="Error"
          message={error || ''}
          buttons={['OK']}
        />
      </IonContent>
    </IonPage>
  );
};

export default EditarCurso;