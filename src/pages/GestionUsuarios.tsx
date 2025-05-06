import React, { useState, useEffect } from 'react';
import { 
    IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
    IonGrid, IonRow, IonCol, IonButton, IonIcon,
    IonAlert, IonToast, IonLoading, IonButtons, IonBackButton,
    IonItem, IonLabel, IonSelect, IonSelectOption, IonInput,
    IonModal, IonText, IonBadge, IonSearchbar
} from '@ionic/react';
import { 
    trash, refresh, warning, clipboardOutline, 
    createOutline, close, checkmark, add
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import './GestionUsuarios.css';

interface Usuario {
    ID: number;
    NOMBRE_USUARIO: string;
    EMAIL: string;
    TELEFONO: string;
    FECHA_CREACION: string;
    ROLE: number;
    PASSWORD?: string;
    CONFIRM_PASSWORD?: string;
}

const GestionUsuarios: React.FC = () => {
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [filteredUsuarios, setFilteredUsuarios] = useState<Usuario[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const [usuarioToDelete, setUsuarioToDelete] = useState<number | null>(null);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [editModal, setEditModal] = useState(false);
    const [createModal, setCreateModal] = useState(false);
    const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
    const [newUser, setNewUser] = useState<Partial<Usuario>>({
        NOMBRE_USUARIO: '',
        EMAIL: '',
        TELEFONO: '',
        ROLE: 1,
        PASSWORD: '',
        CONFIRM_PASSWORD: ''
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<number | 'all'>('all');
    const token = localStorage.getItem('token');
    const history = useHistory();
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    const fetchUsuarios = async () => {
        setLoading(true);
        setError('');
        
        try {
            const response = await fetch(`${API_URL}/api/admin/usuarios`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
    
            if (response.status === 401) {
                localStorage.removeItem('token');
                history.push('/login');
                return;
            }
    
            if (response.status === 403) {
                throw new Error('Acceso denegado: No tienes permisos de administrador');
            }
    
            const data = await response.json();
    
            if (!response.ok) {
                throw new Error(data.error || data.message || `Error ${response.status}`);
            }
    
            setUsuarios(data.data);
            setFilteredUsuarios(data.data);
            
        } catch (err) {
            const message = (err instanceof Error) ? err.message : 'Error desconocido';
            setError(message);
            setToastMessage(message);
            setShowToast(true);
    
            if (message.includes('denegado') || message.includes('permisos')) {
                setTimeout(() => history.push('/unauthorized'), 2000);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsuarios();
    }, []);

    useEffect(() => {
        filterUsers();
    }, [searchTerm, roleFilter, usuarios]);

    const filterUsers = () => {
        let result = [...usuarios];
        
        if (roleFilter !== 'all') {
            result = result.filter(user => user.ROLE === roleFilter);
        }
        
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(user => 
                user.NOMBRE_USUARIO.toLowerCase().includes(term) ||
                user.EMAIL.toLowerCase().includes(term) ||
                (user.TELEFONO && user.TELEFONO.includes(term))
            );
        }
        
        setFilteredUsuarios(result);
    };

    const handleDelete = async (id: number) => {
        try {
            const response = await fetch(`${API_URL}/api/admin/usuarios/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `Error ${response.status}`);
            }

            setUsuarios(prev => prev.filter(user => user.ID !== id));
            setToastMessage('Usuario eliminado correctamente');
            
        } catch (err) {
            setToastMessage((err as Error)?.message || 'Error al eliminar usuario');
        } finally {
            setShowToast(true);
            setShowDeleteAlert(false);
        }
    };

    const handleUpdate = async () => {
        if (!currentUser) return;
        
        try {
            const response = await fetch(`${API_URL}/api/admin/usuarios/${currentUser.ID}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    NOMBRE_USUARIO: currentUser.NOMBRE_USUARIO,
                    TELEFONO: currentUser.TELEFONO,
                    ROLE: currentUser.ROLE
                })
            });
    
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || data.message || `Error ${response.status}`);
            }
    
            setUsuarios(prev => 
                prev.map(user => 
                    user.ID === currentUser.ID ? { ...user, ...data.data } : user
                )
            );
            
            setToastMessage(data.message || 'Usuario actualizado correctamente');
            setEditModal(false);
        } catch (err) {
            setToastMessage((err as Error)?.message || 'Error al actualizar usuario');
        } finally {
            setShowToast(true);
        }
    };

    const handleCreate = async () => {
        if (!newUser.EMAIL || !newUser.NOMBRE_USUARIO || !newUser.PASSWORD || !newUser.CONFIRM_PASSWORD) {
            setToastMessage('Todos los campos son obligatorios');
            setShowToast(true);
            return;
        }
    
        if (newUser.PASSWORD !== newUser.CONFIRM_PASSWORD) {
            setToastMessage('Las contraseñas no coinciden');
            setShowToast(true);
            return;
        }
    
        try {
            const response = await fetch(`${API_URL}/api/admin/usuarios`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    NOMBRE_USUARIO: newUser.NOMBRE_USUARIO,
                    EMAIL: newUser.EMAIL,
                    TELEFONO: newUser.TELEFONO || null, // Asegúrate de manejar el caso null
                    ROLE: newUser.ROLE || 1, // Valor por defecto
                    PASSWORD: newUser.PASSWORD,
                    CONFIRM_PASSWORD: newUser.CONFIRM_PASSWORD // Añadido para validación en backend
                })
            });
    
            // Mejor manejo de la respuesta
            const data = await response.json();
            
            if (!response.ok) {
                // Muestra el mensaje de error del backend si existe
                throw new Error(data.error || data.message || `Error ${response.status}`);
            }
    
            setUsuarios(prev => [...prev, data.data]);
            setToastMessage(data.message || 'Usuario creado correctamente');
            setCreateModal(false);
            setNewUser({
                NOMBRE_USUARIO: '',
                EMAIL: '',
                TELEFONO: '',
                ROLE: 1,
                PASSWORD: '',
                CONFIRM_PASSWORD: ''
            });
        } catch (err) {
            // Muestra el mensaje de error completo
            const errorMessage = (err as Error).message;
            console.error('Error al crear usuario:', errorMessage);
            setToastMessage(errorMessage);
            setShowToast(true);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setToastMessage('Copiado al portapapeles');
            setShowToast(true);
        });
    };

    const formatRole = (role: number) => {
        switch(role) {
            case 1: return <IonBadge color="medium">Usuario</IonBadge>;
            case 2: return <IonBadge color="danger">Administrador</IonBadge>;
            default: return <IonBadge color="warning">Rol {role}</IonBadge>;
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        
        return date.toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar color="primary">
                    <IonButtons slot="start">
                        <IonBackButton defaultHref="/InicioAdmin" />
                    </IonButtons>
                    <IonTitle>Gestión de Usuarios</IonTitle>
                    <IonButton 
                        slot="end" 
                        fill="clear" 
                        onClick={fetchUsuarios}
                    >
                        <IonIcon icon={refresh} />
                    </IonButton>
                </IonToolbar>
            </IonHeader>
            
            <IonContent className="ion-padding">
                <div className="users-filters">
                    <IonSearchbar 
                        value={searchTerm}
                        onIonChange={e => setSearchTerm(e.detail.value || '')}
                        placeholder="Buscar usuarios..."
                    />
                    
                    <IonItem>
                        <IonLabel>Filtrar por rol:</IonLabel>
                        <IonSelect 
                            value={roleFilter}
                            onIonChange={e => setRoleFilter(e.detail.value)}
                        >
                            <IonSelectOption value="all">Todos</IonSelectOption>
                            <IonSelectOption value={1}>Usuarios</IonSelectOption>
                            <IonSelectOption value={2}>Administradores</IonSelectOption>
                        </IonSelect>
                    </IonItem>

                    <IonButton 
                        color="success" 
                        onClick={() => setCreateModal(true)}
                        className="ion-margin-top"
                    >
                        <IonIcon icon={add} slot="start" />
                        Nuevo Usuario
                    </IonButton>
                </div>
                
                {loading && <IonLoading isOpen={loading} />}
                
                {error && !loading && (
                    <div className="error-message">
                        <IonIcon icon={warning} color="danger" />
                        <p>{error}</p>
                        <IonButton onClick={fetchUsuarios}>
                            Reintentar
                        </IonButton>
                    </div>
                )}

                {!loading && !error && (
                    <IonGrid className="users-table">
                        <IonRow className="table-header">
                            <IonCol>ID</IonCol>
                            <IonCol>Nombre</IonCol>
                            <IonCol>Email</IonCol>
                            <IonCol>Rol</IonCol>
                            <IonCol>Teléfono</IonCol>
                            <IonCol>Registro</IonCol>
                            <IonCol>Acciones</IonCol>
                        </IonRow>

                        {filteredUsuarios.length === 0 ? (
                            <IonRow>
                                <IonCol>No hay usuarios</IonCol>
                            </IonRow>
                        ) : (
                            filteredUsuarios.map(usuario => (
                                <IonRow key={usuario.ID}>
                                    <IonCol>{usuario.ID}</IonCol>
                                    <IonCol>{usuario.NOMBRE_USUARIO}</IonCol>
                                    <IonCol onClick={() => copyToClipboard(usuario.EMAIL)}>
                                        {usuario.EMAIL}
                                        <IonIcon icon={clipboardOutline} />
                                    </IonCol>
                                    <IonCol>{formatRole(usuario.ROLE)}</IonCol>
                                    <IonCol>{usuario.TELEFONO || '-'}</IonCol>
                                    <IonCol>{formatDate(usuario.FECHA_CREACION)}</IonCol>
                                    <IonCol>
                                        <IonButton 
                                            color="primary" 
                                            onClick={() => {
                                                setCurrentUser(usuario);
                                                setEditModal(true);
                                            }}
                                        >
                                            <IonIcon icon={createOutline} />
                                        </IonButton>
                                        <IonButton 
                                            color="danger" 
                                            onClick={() => {
                                                setUsuarioToDelete(usuario.ID);
                                                setShowDeleteAlert(true);
                                            }}
                                        >
                                            <IonIcon icon={trash} />
                                        </IonButton>
                                    </IonCol>
                                </IonRow>
                            ))
                        )}
                    </IonGrid>
                )}

                {/* Modal de edición */}
                <IonModal isOpen={editModal}>
                    <IonHeader>
                        <IonToolbar>
                            <IonButtons slot="start">
                                <IonButton onClick={() => setEditModal(false)}>
                                    <IonIcon icon={close} />
                                </IonButton>
                            </IonButtons>
                            <IonTitle>Editar Usuario</IonTitle>
                            <IonButtons slot="end">
                                <IonButton onClick={handleUpdate}>
                                    <IonIcon icon={checkmark} />
                                </IonButton>
                            </IonButtons>
                        </IonToolbar>
                    </IonHeader>
                    <IonContent>
                        {currentUser && (
                            <div className="form-container">
                                <IonItem>
                                    <IonLabel>Nombre</IonLabel>
                                    <IonInput 
                                        value={currentUser.NOMBRE_USUARIO}
                                        onIonChange={e => setCurrentUser({
                                            ...currentUser,
                                            NOMBRE_USUARIO: e.detail.value || ''
                                        })}
                                    />
                                </IonItem>
                                
                                <IonItem>
                                    <IonLabel>Email</IonLabel>
                                    <IonInput 
                                        value={currentUser.EMAIL}
                                        readonly
                                    />
                                </IonItem>
                                
                                <IonItem>
                                    <IonLabel>Teléfono</IonLabel>
                                    <IonInput 
                                        value={currentUser.TELEFONO}
                                        onIonChange={e => setCurrentUser({
                                            ...currentUser,
                                            TELEFONO: e.detail.value || ''
                                        })}
                                    />
                                </IonItem>
                                
                                <IonItem>
                                    <IonLabel>Rol</IonLabel>
                                    <IonSelect 
                                        value={currentUser.ROLE}
                                        onIonChange={e => setCurrentUser({
                                            ...currentUser,
                                            ROLE: e.detail.value
                                        })}
                                    >
                                        <IonSelectOption value={1}>Usuario</IonSelectOption>
                                        <IonSelectOption value={2}>Administrador</IonSelectOption>
                                    </IonSelect>
                                </IonItem>
                            </div>
                        )}
                    </IonContent>
                </IonModal>

                {/* Modal de creación */}
                <IonModal isOpen={createModal}>
                    <IonHeader>
                        <IonToolbar>
                            <IonButtons slot="start">
                                <IonButton onClick={() => setCreateModal(false)}>
                                    <IonIcon icon={close} />
                                </IonButton>
                            </IonButtons>
                            <IonTitle>Nuevo Usuario</IonTitle>
                            <IonButtons slot="end">
                                <IonButton onClick={handleCreate}>
                                    <IonIcon icon={checkmark} />
                                </IonButton>
                            </IonButtons>
                        </IonToolbar>
                    </IonHeader>
                    <IonContent>
                        <div className="form-container">
                            <IonItem>
                                <IonLabel>Nombre*</IonLabel>
                                <IonInput 
                                    value={newUser.NOMBRE_USUARIO}
                                    onIonChange={e => setNewUser({
                                        ...newUser,
                                        NOMBRE_USUARIO: e.detail.value || ''
                                    })}
                                />
                            </IonItem>
                            
                            <IonItem>
                                <IonLabel>Email*</IonLabel>
                                <IonInput 
                                    value={newUser.EMAIL}
                                    type="email"
                                    onIonChange={e => setNewUser({
                                        ...newUser,
                                        EMAIL: e.detail.value || ''
                                    })}
                                />
                            </IonItem>
                            
                            <IonItem>
                                <IonLabel>Teléfono</IonLabel>
                                <IonInput 
                                    value={newUser.TELEFONO}
                                    onIonChange={e => setNewUser({
                                        ...newUser,
                                        TELEFONO: e.detail.value || ''
                                    })}
                                />
                            </IonItem>
                            
                            <IonItem>
                                <IonLabel>Rol*</IonLabel>
                                <IonSelect 
                                    value={newUser.ROLE}
                                    onIonChange={e => setNewUser({
                                        ...newUser,
                                        ROLE: e.detail.value
                                    })}
                                >
                                    <IonSelectOption value={1}>Usuario</IonSelectOption>
                                    <IonSelectOption value={2}>Administrador</IonSelectOption>
                                </IonSelect>
                            </IonItem>
                            
                            <IonItem>
                                <IonLabel>Contraseña*</IonLabel>
                                <IonInput 
                                    value={newUser.PASSWORD}
                                    type="password"
                                    onIonChange={e => setNewUser({
                                        ...newUser,
                                        PASSWORD: e.detail.value || ''
                                    })}
                                />
                            </IonItem>
                            
                            <IonItem>
                                <IonLabel>Confirmar Contraseña*</IonLabel>
                                <IonInput 
                                    value={newUser.CONFIRM_PASSWORD}
                                    type="password"
                                    onIonChange={e => setNewUser({
                                        ...newUser,
                                        CONFIRM_PASSWORD: e.detail.value || ''
                                    })}
                                />
                            </IonItem>
                        </div>
                    </IonContent>
                </IonModal>

                <IonAlert
                    isOpen={showDeleteAlert}
                    onDidDismiss={() => setShowDeleteAlert(false)}
                    header="Confirmar"
                    message="¿Eliminar este usuario?"
                    buttons={[
                        'Cancelar',
                        {
                            text: 'Eliminar',
                            handler: () => {
                                if (usuarioToDelete) {
                                    handleDelete(usuarioToDelete);
                                }
                            }
                        }
                    ]}
                />

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

export default GestionUsuarios;