import React, { useState, useEffect } from 'react';
import { 
    IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
    IonGrid, IonRow, IonCol, IonButton, IonIcon,
    IonAlert, IonToast, IonLoading, IonButtons, IonBackButton,
    IonItem, IonLabel, IonSelect, IonSelectOption, IonInput,
    IonModal, IonFooter, IonText, IonBadge, IonSearchbar
} from '@ionic/react';
import { 
    trash, refresh, warning, clipboardOutline, 
    createOutline, close, checkmark, search
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
    const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<number | 'all'>('all');
    const token = localStorage.getItem('token');
    const history = useHistory();
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    const fetchUsuarios = async () => {
        console.log('[DEBUG] Iniciando carga de usuarios...');
        setLoading(true);
        setError('');
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const response = await fetch(`${API_URL}/api/admin/usuarios`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            console.log('[DEBUG] Respuesta recibida:', response.status);

            if (response.status === 401) {
                console.log('[DEBUG] Token inválido o expirado');
                localStorage.removeItem('token');
                localStorage.removeItem('userData');
                history.push('/login');
                return;
            }

            if (response.status === 403) {
                throw new Error('Acceso denegado: No tienes permisos de administrador');
            }

            const data = await response.json();
            console.log('[DEBUG] Datos recibidos:', data);

            if (!response.ok) {
                throw new Error(data.error || `Error ${response.status}`);
            }

            if (!data.success) {
                throw new Error(data.error || 'Respuesta no exitosa del servidor');
            }

            if (!Array.isArray(data.data)) {
                throw new Error('Formato de datos inválido');
            }

            setUsuarios(data.data);
            setFilteredUsuarios(data.data);
            setError('');
            
        } catch (err) {
            console.error('[ERROR] Error al obtener usuarios:', err);
            
            let message: string;
            if (err instanceof Error) {
                message = err.name === 'AbortError' 
                    ? 'El servidor no respondió a tiempo' 
                    : err.message;
            } else {
                message = 'Error desconocido al cargar usuarios';
            }
            
            setError(message);
            setToastMessage(message);
            setShowToast(true);

            if (message.includes('403') || message.includes('denegado') || message.includes('permisos')) {
                setTimeout(() => history.push('/unauthorized'), 2000);
            }
        } finally {
            setLoading(false);
            console.log('[DEBUG] Carga de usuarios finalizada');
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
        
        // Filtrar por rol
        if (roleFilter !== 'all') {
            result = result.filter(user => user.ROLE === roleFilter);
        }
        
        // Filtrar por término de búsqueda
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
            console.log(`[DEBUG] Intentando eliminar usuario ID: ${id}`);
            const response = await fetch(`${API_URL}/api/admin/usuarios/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            console.log('[DEBUG] Respuesta de eliminación:', data);

            if (!response.ok) {
                throw new Error(data.error || `Error ${response.status}`);
            }

            setUsuarios(prev => prev.filter(user => user.ID !== id));
            setToastMessage(data.message || 'Usuario eliminado correctamente');
            
        } catch (err) {
            console.error('[ERROR] Error al eliminar usuario:', err);
            const message = (err as Error)?.message || 'Error al eliminar usuario';
            setToastMessage(message);
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
                throw new Error(data.error || `Error ${response.status}`);
            }

            setUsuarios(prev => 
                prev.map(user => 
                    user.ID === currentUser.ID ? currentUser : user
                )
            );
            
            setToastMessage('Usuario actualizado correctamente');
            setEditModal(false);
        } catch (err) {
            console.error('[ERROR] Error al actualizar usuario:', err);
            setToastMessage((err as Error)?.message || 'Error al actualizar usuario');
        } finally {
            setShowToast(true);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setToastMessage('Copiado al portapapeles');
            setShowToast(true);
        }).catch(err => {
            console.error('[ERROR] Error al copiar:', err);
            setToastMessage('Error al copiar');
            setShowToast(true);
        });
    };

    const formatRole = (role: number) => {
        switch(role) {
            case 1: return <IonBadge color="medium">Usuario</IonBadge>;
            case 2: return <IonBadge color="danger">Administrador</IonBadge>;
            case 3: return <IonBadge color="primary">Editor</IonBadge>;
            default: return <IonBadge color="warning">Rol {role}</IonBadge>;
        }
    };

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString;
            
            return date.toLocaleString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return dateString;
        }
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar color="primary">
                    <IonButtons slot="start">
                        <IonBackButton defaultHref="/InicioAdmin" text="Volver" />
                    </IonButtons>
                    <IonTitle>Administración de Usuarios</IonTitle>
                    <IonButton 
                        slot="end" 
                        fill="clear" 
                        onClick={fetchUsuarios} 
                        title="Recargar"
                        disabled={loading}
                    >
                        <IonIcon icon={refresh} />
                    </IonButton>
                </IonToolbar>
            </IonHeader>
            
            <IonContent className="ion-padding">
                <div className="admin-users-container">
                    {/* Filtros y búsqueda */}
                    <div className="users-filters ion-margin-bottom">
                        <IonSearchbar 
                            value={searchTerm}
                            onIonChange={e => setSearchTerm(e.detail.value || '')}
                            placeholder="Buscar usuarios..."
                            animated
                            debounce={300}
                        />
                        
                        <IonItem>
                            <IonLabel>Filtrar por rol:</IonLabel>
                            <IonSelect 
                                value={roleFilter}
                                onIonChange={e => setRoleFilter(e.detail.value)}
                                interface="popover"
                            >
                                <IonSelectOption value="all">Todos</IonSelectOption>
                                <IonSelectOption value={1}>Usuarios</IonSelectOption>
                                <IonSelectOption value={2}>Administradores</IonSelectOption>
                                <IonSelectOption value={3}>Editores</IonSelectOption>
                            </IonSelect>
                        </IonItem>
                    </div>
                    
                    {loading && (
                        <div className="loading-container">
                            <IonLoading 
                                isOpen={loading} 
                                message="Cargando usuarios..." 
                                spinner="crescent"
                            />
                        </div>
                    )}
                    
                    {error && !loading && (
                        <div className="error-message ion-text-center ion-padding">
                            <IonIcon icon={warning} color="danger" size="large" />
                            <h3>Error al cargar usuarios</h3>
                            <p>{error}</p>
                            <IonButton 
                                onClick={fetchUsuarios} 
                                color="medium"
                                fill="outline"
                            >
                                Reintentar
                            </IonButton>
                        </div>
                    )}

                    {!loading && !error && (
                        <>
                            <div className="table-info ion-margin-bottom">
                                <p>
                                    Mostrando <strong>{filteredUsuarios.length}</strong> de <strong>{usuarios.length}</strong> usuarios
                                </p>
                            </div>
                            
                            <IonGrid className="admin-users-table" fixed>
                                <IonRow className="table-header">
                                    <IonCol size="2">ID</IonCol>
                                    <IonCol size="3">Nombre</IonCol>
                                    <IonCol size="3">Email</IonCol>
                                    <IonCol size="2">Rol</IonCol>
                                    <IonCol size="2">Teléfono</IonCol>
                                    <IonCol size="3">Registro</IonCol>
                                    <IonCol size="1">Acciones</IonCol>
                                </IonRow>

                                {filteredUsuarios.length === 0 ? (
                                    <IonRow>
                                        <IonCol className="empty-message ion-text-center" size="12">
                                            <IonIcon icon={warning} size="large" color="medium" />
                                            <p>No se encontraron usuarios con los filtros aplicados</p>
                                        </IonCol>
                                    </IonRow>
                                ) : (
                                    filteredUsuarios.map(usuario => (
                                        <IonRow key={usuario.ID} className="table-row">
                                            <IonCol size="2" data-label="ID">{usuario.ID}</IonCol>
                                            <IonCol size="3" data-label="Nombre">{usuario.NOMBRE_USUARIO}</IonCol>
                                            <IonCol size="3" data-label="Email">
                                                <span 
                                                    className="email-cell" 
                                                    onClick={() => copyToClipboard(usuario.EMAIL)}
                                                    title="Copiar email"
                                                >
                                                    {usuario.EMAIL}
                                                    <IonIcon icon={clipboardOutline} className="copy-icon" />
                                                </span>
                                            </IonCol>
                                            <IonCol size="2" data-label="Rol">{formatRole(usuario.ROLE)}</IonCol>
                                            <IonCol size="2" data-label="Teléfono">{usuario.TELEFONO || '-'}</IonCol>
                                            <IonCol size="3" data-label="Registro">{formatDate(usuario.FECHA_CREACION)}</IonCol>
                                            <IonCol size="1" data-label="Acciones">
                                                <div className="action-buttons">
                                                    <IonButton 
                                                        color="primary" 
                                                        size="small"
                                                        fill="clear"
                                                        onClick={() => {
                                                            setCurrentUser(usuario);
                                                            setEditModal(true);
                                                        }}
                                                        title="Editar usuario"
                                                    >
                                                        <IonIcon icon={createOutline} />
                                                    </IonButton>
                                                    <IonButton 
                                                        color="danger" 
                                                        size="small"
                                                        fill="clear"
                                                        onClick={() => {
                                                            setUsuarioToDelete(usuario.ID);
                                                            setShowDeleteAlert(true);
                                                        }}
                                                        title="Eliminar usuario"
                                                    >
                                                        <IonIcon icon={trash} />
                                                    </IonButton>
                                                </div>
                                            </IonCol>
                                        </IonRow>
                                    ))
                                )}
                            </IonGrid>
                        </>
                    )}
                </div>

                {/* Modal de edición */}
                <IonModal isOpen={editModal} onDidDismiss={() => setEditModal(false)}>
                    <IonHeader>
                        <IonToolbar>
                            <IonButtons slot="start">
                                <IonButton onClick={() => setEditModal(false)}>
                                    <IonIcon slot="icon-only" icon={close} />
                                </IonButton>
                            </IonButtons>
                            <IonTitle>Editar Usuario</IonTitle>
                            <IonButtons slot="end">
                                <IonButton strong={true} onClick={handleUpdate}>
                                    <IonIcon slot="icon-only" icon={checkmark} />
                                </IonButton>
                            </IonButtons>
                        </IonToolbar>
                    </IonHeader>
                    <IonContent className="ion-padding">
                        {currentUser && (
                            <div className="edit-user-form">
                                <IonItem>
                                    <IonLabel position="stacked">Nombre</IonLabel>
                                    <IonInput 
                                        value={currentUser.NOMBRE_USUARIO}
                                        onIonChange={e => setCurrentUser({
                                            ...currentUser,
                                            NOMBRE_USUARIO: e.detail.value || ''
                                        })}
                                    />
                                </IonItem>
                                
                                <IonItem>
                                    <IonLabel position="stacked">Email</IonLabel>
                                    <IonInput 
                                        value={currentUser.EMAIL}
                                        type="email"
                                        readonly
                                    />
                                </IonItem>
                                
                                <IonItem>
                                    <IonLabel position="stacked">Teléfono</IonLabel>
                                    <IonInput 
                                        value={currentUser.TELEFONO}
                                        type="tel"
                                        onIonChange={e => setCurrentUser({
                                            ...currentUser,
                                            TELEFONO: e.detail.value || ''
                                        })}
                                    />
                                </IonItem>
                                
                                <IonItem>
                                    <IonLabel position="stacked">Rol</IonLabel>
                                    <IonSelect 
                                        value={currentUser.ROLE}
                                        onIonChange={e => setCurrentUser({
                                            ...currentUser,
                                            ROLE: e.detail.value
                                        })}
                                    >
                                        <IonSelectOption value={1}>Usuario</IonSelectOption>
                                        <IonSelectOption value={2}>Administrador</IonSelectOption>
                                        <IonSelectOption value={3}>Editor</IonSelectOption>
                                    </IonSelect>
                                </IonItem>
                                
                                <IonItem>
                                    <IonLabel position="stacked">Fecha de Registro</IonLabel>
                                    <IonInput 
                                        value={formatDate(currentUser.FECHA_CREACION)}
                                        readonly
                                    />
                                </IonItem>
                            </div>
                        )}
                    </IonContent>
                </IonModal>

                {/* Alerta de eliminación */}
                <IonAlert
                    isOpen={showDeleteAlert}
                    onDidDismiss={() => setShowDeleteAlert(false)}
                    header="Confirmar Eliminación"
                    message="¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer."
                    buttons={[
                        { 
                            text: 'Cancelar', 
                            role: 'cancel',
                            cssClass: 'alert-button-cancel'
                        },
                        { 
                            text: 'Eliminar', 
                            handler: () => {
                                if (usuarioToDelete) {
                                    handleDelete(usuarioToDelete);
                                }
                            },
                            cssClass: 'alert-button-confirm'
                        }
                    ]}
                />

                {/* Notificaciones Toast */}
                <IonToast
                    isOpen={showToast}
                    onDidDismiss={() => setShowToast(false)}
                    message={toastMessage}
                    duration={3000}
                    position="top"
                    color={toastMessage.includes('Error') ? 'danger' : 'success'}
                />
            </IonContent>
        </IonPage>
    );
};

export default GestionUsuarios;