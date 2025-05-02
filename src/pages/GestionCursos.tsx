import React, { useState, useEffect } from 'react';
import { 
    IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
    IonGrid, IonRow, IonCol, IonButton, IonIcon,
    IonAlert, IonToast, IonLoading, IonButtons, IonBackButton,
    IonItem, IonLabel, IonSelect, IonSelectOption, IonInput,
    IonModal, IonFooter, IonText, IonBadge, IonSearchbar,
    IonImg, IonThumbnail, IonTextarea, IonDatetime, IonChip
} from '@ionic/react';
import { 
    trash, refresh, warning, clipboardOutline, 
    createOutline, close, checkmark, search,
    add, cloudUpload, documentAttach, time
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import './GestionCursos.css';

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
    ranking: number;
    imagenes_materiales: string[];
}

interface Usuario {
    ID: number;
    NOMBRE_USUARIO: string;
}

const GestionCursos: React.FC = () => {
    const [cursos, setCursos] = useState<Curso[]>([]);
    const [filteredCursos, setFilteredCursos] = useState<Curso[]>([]);
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const [cursoToDelete, setCursoToDelete] = useState<number | null>(null);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [editModal, setEditModal] = useState(false);
    const [currentCurso, setCurrentCurso] = useState<Curso | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const token = localStorage.getItem('token');
    const history = useHistory();
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    const fetchCursos = async () => {
        console.log('[DEBUG] Iniciando carga de cursos...');
        setLoading(true);
        setError('');
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            // Obtener cursos
            const cursosResponse = await fetch(`${API_URL}/api/admin/cursos`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            console.log('[DEBUG] Respuesta de cursos recibida:', cursosResponse.status);

            if (cursosResponse.status === 401) {
                console.log('[DEBUG] Token inválido o expirado');
                localStorage.removeItem('token');
                localStorage.removeItem('userData');
                history.push('/login');
                return;
            }

            if (cursosResponse.status === 403) {
                throw new Error('Acceso denegado: No tienes permisos de administrador');
            }

            const cursosData = await cursosResponse.json();
            console.log('[DEBUG] Datos de cursos recibidos:', cursosData);

            if (!cursosResponse.ok) {
                throw new Error(cursosData.error || `Error ${cursosResponse.status}`);
            }

            if (!cursosData.success) {
                throw new Error(cursosData.error || 'Respuesta no exitosa del servidor');
            }

            if (!Array.isArray(cursosData.data)) {
                throw new Error('Formato de datos de cursos inválido');
            }

            // Obtener usuarios (profesores)
            const usuariosResponse = await fetch(`${API_URL}/api/admin/usuarios`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                signal: controller.signal
            });

            const usuariosData = await usuariosResponse.json();
            console.log('[DEBUG] Datos de usuarios recibidos:', usuariosData);

            if (!usuariosResponse.ok) {
                throw new Error(usuariosData.error || `Error ${usuariosResponse.status}`);
            }

            if (!usuariosData.success) {
                throw new Error(usuariosData.error || 'Respuesta no exitosa del servidor para usuarios');
            }

            if (!Array.isArray(usuariosData.data)) {
                throw new Error('Formato de datos de usuarios inválido');
            }

            setCursos(cursosData.data);
            setFilteredCursos(cursosData.data);
            setUsuarios(usuariosData.data);
            setError('');
            
        } catch (err) {
            console.error('[ERROR] Error al obtener datos:', err);
            
            let message: string;
            if (err instanceof Error) {
                message = err.name === 'AbortError' 
                    ? 'El servidor no respondió a tiempo' 
                    : err.message;
            } else {
                message = 'Error desconocido al cargar datos';
            }
            
            setError(message);
            setToastMessage(message);
            setShowToast(true);

            if (message.includes('403') || message.includes('denegado') || message.includes('permisos')) {
                setTimeout(() => history.push('/unauthorized'), 2000);
            }
        } finally {
            setLoading(false);
            console.log('[DEBUG] Carga de datos finalizada');
        }
    };

    useEffect(() => {
        fetchCursos();
    }, []);

    useEffect(() => {
        filterCursos();
    }, [searchTerm, categoryFilter, cursos]);

    const filterCursos = () => {
        let result = [...cursos];
        
        // Filtrar por categoría
        if (categoryFilter !== 'all') {
            result = result.filter(curso => curso.categoria === categoryFilter);
        }
        
        // Filtrar por término de búsqueda
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(curso => 
                curso.nombre.toLowerCase().includes(term) ||
                curso.profesor.toLowerCase().includes(term) ||
                curso.categoria.toLowerCase().includes(term)
            );
        }
        
        setFilteredCursos(result);
    };

    const handleDelete = async (id: number) => {
        try {
            console.log(`[DEBUG] Intentando eliminar curso ID: ${id}`);
            const response = await fetch(`${API_URL}/api/admin/cursos/${id}`, {
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

            setCursos(prev => prev.filter(curso => curso.id !== id));
            setToastMessage(data.message || 'Curso eliminado correctamente');
            
        } catch (err) {
            console.error('[ERROR] Error al eliminar curso:', err);
            const message = (err as Error)?.message || 'Error al eliminar curso';
            setToastMessage(message);
        } finally {
            setShowToast(true);
            setShowDeleteAlert(false);
        }
    };

    const handleUpdate = async () => {
        if (!currentCurso) return;
        
        try {
            const response = await fetch(`${API_URL}/api/admin/cursos/${currentCurso.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    nombre: currentCurso.nombre,
                    descripcion: currentCurso.descripcion,
                    categoria: currentCurso.categoria,
                    precio: currentCurso.precio,
                    entrega: currentCurso.entrega,
                    horario: currentCurso.horario,
                    id_usuario: currentCurso.id_usuario
                })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || `Error ${response.status}`);
            }

            setCursos(prev => 
                prev.map(curso => 
                    curso.id === currentCurso.id ? currentCurso : curso
                )
            );
            
            setToastMessage('Curso actualizado correctamente');
            setEditModal(false);
        } catch (err) {
            console.error('[ERROR] Error al actualizar curso:', err);
            setToastMessage((err as Error)?.message || 'Error al actualizar curso');
        } finally {
            setShowToast(true);
        }
    };

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString;
            
            return date.toLocaleString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch {
            return dateString;
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR'
        }).format(price);
    };

    const getUniqueCategories = () => {
        const categories = cursos.map(curso => curso.categoria);
        return ['all', ...new Set(categories)].filter(cat => cat);
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar color="primary">
                    <IonButtons slot="start">
                        <IonBackButton defaultHref="/InicioAdmin" text="Volver" />
                    </IonButtons>
                    <IonTitle>Administración de Cursos</IonTitle>
                    <IonButton 
                        slot="end" 
                        fill="clear" 
                        onClick={fetchCursos} 
                        title="Recargar"
                        disabled={loading}
                    >
                        <IonIcon icon={refresh} />
                    </IonButton>
                </IonToolbar>
            </IonHeader>
            
            <IonContent className="ion-padding">
                <div className="admin-cursos-container">
                    {/* Filtros y búsqueda */}
                    <div className="cursos-filters ion-margin-bottom">
                        <IonSearchbar 
                            value={searchTerm}
                            onIonChange={e => setSearchTerm(e.detail.value || '')}
                            placeholder="Buscar cursos..."
                            animated
                            debounce={300}
                        />
                        
                        <IonItem>
                            <IonLabel>Filtrar por categoría:</IonLabel>
                            <IonSelect 
                                value={categoryFilter}
                                onIonChange={e => setCategoryFilter(e.detail.value)}
                                interface="popover"
                            >
                                <IonSelectOption value="all">Todas</IonSelectOption>
                                {getUniqueCategories().map((category, index) => (
                                    category !== 'all' && (
                                        <IonSelectOption key={index} value={category}>
                                            {category}
                                        </IonSelectOption>
                                    )
                                ))}
                            </IonSelect>
                        </IonItem>
                    </div>
                    
                    {loading && (
                        <div className="loading-container">
                            <IonLoading 
                                isOpen={loading} 
                                message="Cargando cursos..." 
                                spinner="crescent"
                            />
                        </div>
                    )}
                    
                    {error && !loading && (
                        <div className="error-message ion-text-center ion-padding">
                            <IonIcon icon={warning} color="danger" size="large" />
                            <h3>Error al cargar cursos</h3>
                            <p>{error}</p>
                            <IonButton 
                                onClick={fetchCursos} 
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
                                    Mostrando <strong>{filteredCursos.length}</strong> de <strong>{cursos.length}</strong> cursos
                                </p>

                            </div>
                            
                            <IonGrid className="admin-cursos-table" fixed>
                                <IonRow className="table-header">
                                    <IonCol size="12" sizeMd="2">Portada</IonCol>
                                    <IonCol size="12" sizeMd="3">Nombre</IonCol>
                                    <IonCol size="12" sizeMd="2">Profesor</IonCol>
                                    <IonCol size="12" sizeMd="2">Categoría</IonCol>
                                    <IonCol size="12" sizeMd="1">Precio</IonCol>
                                    <IonCol size="12" sizeMd="1">Rating</IonCol>
                                    <IonCol size="12" sizeMd="1">Acciones</IonCol>
                                </IonRow>

                                {filteredCursos.length === 0 ? (
                                    <IonRow>
                                        <IonCol className="empty-message ion-text-center" size="12">
                                            <IonIcon icon={warning} size="large" color="medium" />
                                            <p>No se encontraron cursos con los filtros aplicados</p>
                                        </IonCol>
                                    </IonRow>
                                ) : (
                                    filteredCursos.map(curso => (
                                        <IonRow key={curso.id} className="table-row">
                                            <IonCol size="12" sizeMd="2" data-label="Portada">
                                                <IonThumbnail className="curso-thumbnail">
                                                    {curso.portada ? (
                                                        <IonImg src={curso.portada} alt={curso.nombre} />
                                                    ) : (
                                                        <div className="thumbnail-placeholder">
                                                            <IonIcon icon={cloudUpload} size="large" />
                                                        </div>
                                                    )}
                                                </IonThumbnail>
                                            </IonCol>
                                            <IonCol size="12" sizeMd="3" data-label="Nombre">
                                                <strong>{curso.nombre}</strong>
                                                <p className="curso-descripcion">{curso.descripcion.substring(0, 60)}...</p>
                                            </IonCol>
                                            <IonCol size="12" sizeMd="2" data-label="Profesor">
                                                {curso.profesor}
                                            </IonCol>
                                            <IonCol size="12" sizeMd="2" data-label="Categoría">
                                                <IonChip color="primary">{curso.categoria}</IonChip>
                                            </IonCol>
                                            <IonCol size="12" sizeMd="1" data-label="Precio">
                                                {formatPrice(curso.precio)}
                                            </IonCol>
                                            <IonCol size="12" sizeMd="1" data-label="Rating">
                                                <IonBadge color="warning">
                                                    {curso.ranking.toFixed(1)} ⭐
                                                </IonBadge>
                                            </IonCol>
                                            <IonCol size="12" sizeMd="1" data-label="Acciones">
                                                <div className="action-buttons">
                                                    <IonButton 
                                                        color="primary" 
                                                        size="small"
                                                        fill="clear"
                                                        onClick={() => {
                                                            setCurrentCurso(curso);
                                                            setEditModal(true);
                                                        }}
                                                        title="Editar curso"
                                                    >
                                                        <IonIcon icon={createOutline} />
                                                    </IonButton>
                                                    <IonButton 
                                                        color="danger" 
                                                        size="small"
                                                        fill="clear"
                                                        onClick={() => {
                                                            setCursoToDelete(curso.id);
                                                            setShowDeleteAlert(true);
                                                        }}
                                                        title="Eliminar curso"
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
                            <IonTitle>{currentCurso?.id ? 'Editar Curso' : 'Nuevo Curso'}</IonTitle>
                            <IonButtons slot="end">
                                <IonButton strong={true} onClick={handleUpdate}>
                                    <IonIcon slot="icon-only" icon={checkmark} />
                                </IonButton>
                            </IonButtons>
                        </IonToolbar>
                    </IonHeader>
                    <IonContent className="ion-padding">
                        {currentCurso && (
                            <div className="edit-curso-form">
                                <IonItem>
                                    <IonLabel position="stacked">Nombre *</IonLabel>
                                    <IonInput 
                                        value={currentCurso.nombre}
                                        onIonChange={e => setCurrentCurso({
                                            ...currentCurso,
                                            nombre: e.detail.value || ''
                                        })}
                                    />
                                </IonItem>
                                
                                <IonItem>
                                    <IonLabel position="stacked">Descripción *</IonLabel>
                                    <IonTextarea 
                                        value={currentCurso.descripcion}
                                        onIonChange={e => setCurrentCurso({
                                            ...currentCurso,
                                            descripcion: e.detail.value || ''
                                        })}
                                        rows={4}
                                    />
                                </IonItem>
                                
                                <IonItem>
                                    <IonLabel position="stacked">Categoría</IonLabel>
                                    <IonInput 
                                        value={currentCurso.categoria}
                                        onIonChange={e => setCurrentCurso({
                                            ...currentCurso,
                                            categoria: e.detail.value || ''
                                        })}
                                    />
                                </IonItem>
                                
                                <IonItem>
                                    <IonLabel position="stacked">Precio (€)</IonLabel>
                                    <IonInput 
                                        value={currentCurso.precio}
                                        type="number"
                                        onIonChange={e => setCurrentCurso({
                                            ...currentCurso,
                                            precio: Number(e.detail.value || 0)
                                        })}
                                    />
                                </IonItem>
                                
                                <IonItem>
                                    <IonLabel position="stacked">Profesor *</IonLabel>
                                    <IonSelect 
                                        value={currentCurso.id_usuario}
                                        onIonChange={e => setCurrentCurso({
                                            ...currentCurso,
                                            id_usuario: Number(e.detail.value)
                                        })}
                                    >
                                        {usuarios.map(usuario => (
                                            <IonSelectOption key={usuario.ID} value={usuario.ID}>
                                                {usuario.NOMBRE_USUARIO}
                                            </IonSelectOption>
                                        ))}
                                    </IonSelect>
                                </IonItem>
                                
                                
                                <IonItem>
                                    <IonLabel position="stacked">Horario</IonLabel>
                                    <IonInput 
                                        value={currentCurso.horario}
                                        onIonChange={e => setCurrentCurso({
                                            ...currentCurso,
                                            horario: e.detail.value || ''
                                        })}
                                    />
                                    <IonIcon slot="end" icon={time} />
                                </IonItem>
                                
                                <IonItem>
                                    <IonLabel>Materiales del curso</IonLabel>
                                    <IonBadge slot="end" color="medium">
                                        {currentCurso.imagenes_materiales?.length || 0} archivos
                                    </IonBadge>
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
                    message="¿Estás seguro de que deseas eliminar este curso? Esta acción no se puede deshacer."
                    buttons={[
                        { 
                            text: 'Cancelar', 
                            role: 'cancel',
                            cssClass: 'alert-button-cancel'
                        },
                        { 
                            text: 'Eliminar', 
                            handler: () => {
                                if (cursoToDelete) {
                                    handleDelete(cursoToDelete);
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

export default GestionCursos;