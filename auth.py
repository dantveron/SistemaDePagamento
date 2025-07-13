from flask import Blueprint, request, jsonify, session
from datetime import datetime, timedelta
import uuid
import hashlib
import hmac
import secrets
import re
import jwt
import pyotp
from functools import wraps
import bcrypt
import json

auth_bp = Blueprint('auth', __name__)

# Configurações (em produção, usar variáveis de ambiente)
JWT_SECRET = 'valora_jwt_secret_key_2025'
JWT_ALGORITHM = 'HS256'
MFA_SECRET_KEY = 'valora_mfa_secret_2025'

# Simulação de base de dados em memória
users_db = {}
sessions_db = {}
mfa_challenges_db = {}
login_attempts_db = {}
security_events_db = {}

# Dados de exemplo
users_db['admin@valorapay.com'] = {
    'id': 'user_001',
    'email': 'admin@valorapay.com',
    'password_hash': bcrypt.hashpw('Admin@123456'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
    'first_name': 'Admin',
    'last_name': 'Valora',
    'phone': '+5511999999999',
    'country': 'BR',
    'business_type': 'small_business',
    'email_verified': True,
    'phone_verified': True,
    'mfa_enabled': True,
    'mfa_secret': pyotp.random_base32(),
    'role': 'admin',
    'permissions': ['read_profile', 'write_profile', 'read_transactions', 'write_transactions', 'admin_access'],
    'created_at': datetime.utcnow().isoformat(),
    'last_login_at': None,
    'login_attempts': 0,
    'is_blocked': False,
    'preferred_language': 'pt-BR',
    'timezone': 'America/Sao_Paulo'
}

def require_auth(f):
    """Decorator para rotas que requerem autenticação"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Token de acesso requerido'}), 401
        
        try:
            if token.startswith('Bearer '):
                token = token[7:]
            
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            user_id = payload['user_id']
            
            if user_id not in [user['id'] for user in users_db.values()]:
                return jsonify({'error': 'Usuário não encontrado'}), 401
            
            # Adicionar usuário ao contexto da requisição
            request.current_user = next(user for user in users_db.values() if user['id'] == user_id)
            
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expirado'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Token inválido'}), 401
        
        return f(*args, **kwargs)
    
    return decorated_function

@auth_bp.route('/api/v1/auth/register', methods=['POST'])
def register():
    """Registro de novo usuário"""
    try:
        data = request.get_json()
        
        # Validação dos dados obrigatórios
        required_fields = ['email', 'password', 'first_name', 'last_name', 'phone', 'country', 'business_type']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Campo obrigatório: {field}'
                }), 400
        
        # Validar e-mail
        if not validate_email(data['email']):
            return jsonify({
                'success': False,
                'error': 'E-mail inválido'
            }), 400
        
        # Verificar se usuário já existe
        if data['email'] in users_db:
            return jsonify({
                'success': False,
                'error': 'E-mail já cadastrado'
            }), 409
        
        # Validar senha
        password_validation = validate_password(data['password'])
        if not password_validation['valid']:
            return jsonify({
                'success': False,
                'error': 'Senha não atende aos critérios de segurança',
                'details': password_validation['errors']
            }), 400
        
        # Validar telefone
        if not validate_phone(data['phone']):
            return jsonify({
                'success': False,
                'error': 'Telefone inválido'
            }), 400
        
        # Validar país
        if not validate_country(data['country']):
            return jsonify({
                'success': False,
                'error': 'Código de país inválido'
            }), 400
        
        # Criar usuário
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        password_hash = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        user = {
            'id': user_id,
            'email': data['email'],
            'password_hash': password_hash,
            'first_name': data['first_name'],
            'last_name': data['last_name'],
            'phone': data['phone'],
            'country': data['country'],
            'business_type': data['business_type'],
            'email_verified': False,
            'phone_verified': False,
            'mfa_enabled': False,
            'mfa_secret': pyotp.random_base32(),
            'role': 'user',
            'permissions': ['read_profile', 'write_profile', 'read_transactions'],
            'created_at': datetime.utcnow().isoformat(),
            'last_login_at': None,
            'login_attempts': 0,
            'is_blocked': False,
            'preferred_language': data.get('preferred_language', 'pt-BR'),
            'timezone': data.get('timezone', 'America/Sao_Paulo')
        }
        
        users_db[data['email']] = user
        
        # Log evento de segurança
        log_security_event(user_id, 'user_registered', 'Usuário registrado com sucesso')
        
        # Gerar token de verificação de e-mail
        verification_token = generate_verification_token(user_id, 'email')
        
        return jsonify({
            'success': True,
            'data': {
                'user_id': user_id,
                'email': data['email'],
                'verification_required': True,
                'verification_token': verification_token  # Em produção, enviar por e-mail
            }
        }), 201
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Erro interno: {str(e)}'
        }), 500

@auth_bp.route('/api/v1/auth/login', methods=['POST'])
def login():
    """Login do usuário"""
    try:
        data = request.get_json()
        
        # Validação dos dados obrigatórios
        if 'email' not in data or 'password' not in data:
            return jsonify({
                'success': False,
                'error': 'E-mail e senha são obrigatórios'
            }), 400
        
        email = data['email'].lower()
        password = data['password']
        
        # Verificar se usuário existe
        if email not in users_db:
            # Log tentativa de login com e-mail inexistente
            log_login_attempt(email, False, 'E-mail não encontrado')
            return jsonify({
                'success': False,
                'error': 'Credenciais inválidas'
            }), 401
        
        user = users_db[email]
        
        # Verificar se conta está bloqueada
        if user['is_blocked']:
            return jsonify({
                'success': False,
                'error': 'Conta temporariamente bloqueada'
            }), 423
        
        # Verificar limite de tentativas
        if user['login_attempts'] >= 5:
            user['is_blocked'] = True
            log_security_event(user['id'], 'account_locked', 'Conta bloqueada por excesso de tentativas')
            return jsonify({
                'success': False,
                'error': 'Muitas tentativas de login. Conta bloqueada.'
            }), 423
        
        # Verificar senha
        if not bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
            user['login_attempts'] += 1
            log_login_attempt(email, False, 'Senha incorreta')
            return jsonify({
                'success': False,
                'error': 'Credenciais inválidas'
            }), 401
        
        # Análise de risco
        risk_assessment = assess_login_risk(user, data)
        
        # Reset tentativas de login
        user['login_attempts'] = 0
        user['last_login_at'] = datetime.utcnow().isoformat()
        
        # Log login bem-sucedido
        log_login_attempt(email, True, 'Login realizado com sucesso')
        log_security_event(user['id'], 'login_success', f'Login de {data.get("country", "unknown")}')
        
        # Verificar se MFA é necessário
        if user['mfa_enabled'] or risk_assessment['require_mfa']:
            # Gerar desafio MFA
            challenge_id = generate_mfa_challenge(user['id'])
            
            # Gerar token de sessão temporário
            session_token = generate_session_token(user['id'], temporary=True)
            
            return jsonify({
                'success': True,
                'requires_mfa': True,
                'session_token': session_token,
                'challenge_id': challenge_id,
                'mfa_methods': ['authenticator', 'sms'] if user['phone_verified'] else ['authenticator']
            })
        
        # Gerar tokens de acesso
        access_token = generate_access_token(user['id'])
        refresh_token = generate_refresh_token(user['id'])
        
        # Criar sessão
        session_id = create_user_session(user['id'], data)
        
        return jsonify({
            'success': True,
            'data': {
                'access_token': access_token,
                'refresh_token': refresh_token,
                'session_id': session_id,
                'user': {
                    'id': user['id'],
                    'email': user['email'],
                    'first_name': user['first_name'],
                    'last_name': user['last_name'],
                    'role': user['role'],
                    'permissions': user['permissions']
                }
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Erro interno: {str(e)}'
        }), 500

@auth_bp.route('/api/v1/auth/mfa/verify', methods=['POST'])
def verify_mfa():
    """Verificação de MFA"""
    try:
        data = request.get_json()
        
        required_fields = ['session_token', 'code', 'method']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Campo obrigatório: {field}'
                }), 400
        
        # Verificar token de sessão temporário
        try:
            payload = jwt.decode(data['session_token'], JWT_SECRET, algorithms=[JWT_ALGORITHM])
            user_id = payload['user_id']
            
            if not payload.get('temporary'):
                return jsonify({
                    'success': False,
                    'error': 'Token de sessão inválido'
                }), 401
                
        except jwt.InvalidTokenError:
            return jsonify({
                'success': False,
                'error': 'Token de sessão inválido'
            }), 401
        
        # Buscar usuário
        user = next((u for u in users_db.values() if u['id'] == user_id), None)
        if not user:
            return jsonify({
                'success': False,
                'error': 'Usuário não encontrado'
            }), 404
        
        # Verificar código MFA
        if data['method'] == 'authenticator':
            totp = pyotp.TOTP(user['mfa_secret'])
            if not totp.verify(data['code'], valid_window=1):
                return jsonify({
                    'success': False,
                    'error': 'Código inválido'
                }), 401
        elif data['method'] == 'sms':
            # Simular verificação SMS (em produção, verificar código enviado)
            if data['code'] != '123456':  # Código fixo para simulação
                return jsonify({
                    'success': False,
                    'error': 'Código inválido'
                }), 401
        else:
            return jsonify({
                'success': False,
                'error': 'Método MFA não suportado'
            }), 400
        
        # Log evento de segurança
        log_security_event(user_id, 'mfa_verified', f'MFA verificado via {data["method"]}')
        
        # Gerar tokens de acesso
        access_token = generate_access_token(user_id)
        refresh_token = generate_refresh_token(user_id)
        
        # Criar sessão
        session_id = create_user_session(user_id, data)
        
        return jsonify({
            'success': True,
            'data': {
                'access_token': access_token,
                'refresh_token': refresh_token,
                'session_id': session_id,
                'user': {
                    'id': user['id'],
                    'email': user['email'],
                    'first_name': user['first_name'],
                    'last_name': user['last_name'],
                    'role': user['role'],
                    'permissions': user['permissions']
                }
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Erro interno: {str(e)}'
        }), 500

@auth_bp.route('/api/v1/auth/logout', methods=['POST'])
@require_auth
def logout():
    """Logout do usuário"""
    try:
        user = request.current_user
        
        # Invalidar todas as sessões do usuário
        sessions_to_remove = [sid for sid, session in sessions_db.items() if session['user_id'] == user['id']]
        for session_id in sessions_to_remove:
            del sessions_db[session_id]
        
        # Log evento de segurança
        log_security_event(user['id'], 'logout', 'Usuário fez logout')
        
        return jsonify({
            'success': True,
            'message': 'Logout realizado com sucesso'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Erro interno: {str(e)}'
        }), 500

@auth_bp.route('/api/v1/auth/refresh', methods=['POST'])
def refresh_token():
    """Renovação de token de acesso"""
    try:
        data = request.get_json()
        
        if 'refresh_token' not in data:
            return jsonify({
                'success': False,
                'error': 'Refresh token é obrigatório'
            }), 400
        
        try:
            payload = jwt.decode(data['refresh_token'], JWT_SECRET, algorithms=[JWT_ALGORITHM])
            user_id = payload['user_id']
            
            if payload.get('type') != 'refresh':
                return jsonify({
                    'success': False,
                    'error': 'Token inválido'
                }), 401
                
        except jwt.InvalidTokenError:
            return jsonify({
                'success': False,
                'error': 'Refresh token inválido'
            }), 401
        
        # Gerar novo token de acesso
        access_token = generate_access_token(user_id)
        
        return jsonify({
            'success': True,
            'data': {
                'access_token': access_token
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Erro interno: {str(e)}'
        }), 500

@auth_bp.route('/api/v1/auth/profile', methods=['GET'])
@require_auth
def get_profile():
    """Obter perfil do usuário"""
    user = request.current_user
    
    return jsonify({
        'success': True,
        'data': {
            'id': user['id'],
            'email': user['email'],
            'first_name': user['first_name'],
            'last_name': user['last_name'],
            'phone': user['phone'],
            'country': user['country'],
            'business_type': user['business_type'],
            'email_verified': user['email_verified'],
            'phone_verified': user['phone_verified'],
            'mfa_enabled': user['mfa_enabled'],
            'role': user['role'],
            'permissions': user['permissions'],
            'created_at': user['created_at'],
            'last_login_at': user['last_login_at'],
            'preferred_language': user['preferred_language'],
            'timezone': user['timezone']
        }
    })

@auth_bp.route('/api/v1/auth/security/events', methods=['GET'])
@require_auth
def get_security_events():
    """Obter eventos de segurança do usuário"""
    user = request.current_user
    
    user_events = [
        event for event in security_events_db.values() 
        if event['user_id'] == user['id']
    ]
    
    # Ordenar por data (mais recentes primeiro)
    user_events.sort(key=lambda x: x['timestamp'], reverse=True)
    
    return jsonify({
        'success': True,
        'data': user_events[:50]  # Últimos 50 eventos
    })

# Funções auxiliares

def validate_email(email):
    """Valida formato do e-mail"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    """Valida força da senha"""
    errors = []
    
    if len(password) < 12:
        errors.append('Senha deve ter pelo menos 12 caracteres')
    
    if not re.search(r'[a-z]', password):
        errors.append('Senha deve conter pelo menos uma letra minúscula')
    
    if not re.search(r'[A-Z]', password):
        errors.append('Senha deve conter pelo menos uma letra maiúscula')
    
    if not re.search(r'\d', password):
        errors.append('Senha deve conter pelo menos um número')
    
    if not re.search(r'[@$!%*?&]', password):
        errors.append('Senha deve conter pelo menos um caractere especial')
    
    # Verificar senhas comuns
    common_passwords = ['password', '123456789', 'qwerty123', 'admin123']
    if password.lower() in common_passwords:
        errors.append('Senha muito comum')
    
    return {
        'valid': len(errors) == 0,
        'errors': errors,
        'strength': 'strong' if len(errors) == 0 else 'weak'
    }

def validate_phone(phone):
    """Valida formato do telefone"""
    pattern = r'^\+?[1-9]\d{1,14}$'
    return re.match(pattern, phone) is not None

def validate_country(country):
    """Valida código do país"""
    valid_countries = ['BR', 'US', 'CA', 'MX', 'AR', 'CL', 'CO', 'PE', 'UY']
    return country in valid_countries

def generate_access_token(user_id):
    """Gera token de acesso JWT"""
    payload = {
        'user_id': user_id,
        'type': 'access',
        'exp': datetime.utcnow() + timedelta(hours=1),
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def generate_refresh_token(user_id):
    """Gera token de renovação JWT"""
    payload = {
        'user_id': user_id,
        'type': 'refresh',
        'exp': datetime.utcnow() + timedelta(days=30),
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def generate_session_token(user_id, temporary=False):
    """Gera token de sessão temporário"""
    payload = {
        'user_id': user_id,
        'type': 'session',
        'temporary': temporary,
        'exp': datetime.utcnow() + timedelta(minutes=10 if temporary else 60),
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def generate_verification_token(user_id, verification_type):
    """Gera token de verificação"""
    payload = {
        'user_id': user_id,
        'type': verification_type,
        'exp': datetime.utcnow() + timedelta(hours=24),
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def generate_mfa_challenge(user_id):
    """Gera desafio MFA"""
    challenge_id = f"mfa_{uuid.uuid4().hex[:16]}"
    
    challenge = {
        'id': challenge_id,
        'user_id': user_id,
        'created_at': datetime.utcnow().isoformat(),
        'expires_at': (datetime.utcnow() + timedelta(minutes=5)).isoformat(),
        'attempts': 0,
        'verified': False
    }
    
    mfa_challenges_db[challenge_id] = challenge
    return challenge_id

def create_user_session(user_id, request_data):
    """Cria sessão do usuário"""
    session_id = f"sess_{uuid.uuid4().hex[:16]}"
    
    session = {
        'id': session_id,
        'user_id': user_id,
        'created_at': datetime.utcnow().isoformat(),
        'expires_at': (datetime.utcnow() + timedelta(hours=24)).isoformat(),
        'ip_address': request_data.get('ip_address', 'unknown'),
        'user_agent': request_data.get('user_agent', 'unknown'),
        'country': request_data.get('country', 'unknown'),
        'is_active': True
    }
    
    sessions_db[session_id] = session
    return session_id

def assess_login_risk(user, request_data):
    """Avalia risco do login"""
    risk_factors = []
    
    # Verificar país diferente
    if request_data.get('country') != user['country']:
        risk_factors.append('different_country')
    
    # Verificar horário incomum
    current_hour = datetime.utcnow().hour
    if current_hour < 6 or current_hour > 23:
        risk_factors.append('unusual_time')
    
    # Verificar tentativas recentes
    if user['login_attempts'] > 0:
        risk_factors.append('recent_failures')
    
    risk_score = len(risk_factors)
    require_mfa = risk_score >= 2 or not user['mfa_enabled']
    
    return {
        'score': risk_score,
        'factors': risk_factors,
        'require_mfa': require_mfa,
        'recommendation': 'challenge' if require_mfa else 'allow'
    }

def log_login_attempt(email, success, reason):
    """Log tentativa de login"""
    attempt_id = f"attempt_{uuid.uuid4().hex[:16]}"
    
    attempt = {
        'id': attempt_id,
        'email': email,
        'success': success,
        'reason': reason,
        'timestamp': datetime.utcnow().isoformat(),
        'ip_address': request.remote_addr or 'unknown'
    }
    
    login_attempts_db[attempt_id] = attempt

def log_security_event(user_id, event_type, description):
    """Log evento de segurança"""
    event_id = f"event_{uuid.uuid4().hex[:16]}"
    
    event = {
        'id': event_id,
        'user_id': user_id,
        'type': event_type,
        'description': description,
        'timestamp': datetime.utcnow().isoformat(),
        'ip_address': request.remote_addr or 'unknown',
        'user_agent': request.headers.get('User-Agent', 'unknown')
    }
    
    security_events_db[event_id] = event

