from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import uuid
import hashlib
import hmac
import base64
import json
import re
from decimal import Decimal
import qrcode
from io import BytesIO
import base64 as b64

payment_bp = Blueprint('payment', __name__)

# Simulação de dados de configuração (em produção, usar variáveis de ambiente)
MERCHANT_CONFIG = {
    'merchant_id': 'valora_merchant_001',
    'api_key': 'sk_test_valora_12345',
    'webhook_secret': 'whsec_valora_67890',
    'pix_key': 'pix@valorapay.com',
    'environment': 'sandbox'  # sandbox ou production
}

# Simulação de base de dados em memória (em produção, usar banco de dados real)
transactions_db = {}
pix_payments_db = {}
boleto_payments_db = {}

@payment_bp.route('/api/v1/payment/methods', methods=['GET'])
def get_payment_methods():
    """Retorna os métodos de pagamento disponíveis"""
    methods = {
        'credit_card': {
            'enabled': True,
            'brands': ['visa', 'mastercard', 'elo', 'amex'],
            'min_amount': 1.00,
            'max_amount': 50000.00,
            'processing_time': 'immediate',
            'fees': {
                'percentage': 3.99,
                'fixed': 0.39
            }
        },
        'debit_card': {
            'enabled': True,
            'brands': ['visa', 'mastercard', 'elo'],
            'min_amount': 1.00,
            'max_amount': 10000.00,
            'processing_time': 'immediate',
            'fees': {
                'percentage': 2.99,
                'fixed': 0.39
            }
        },
        'pix': {
            'enabled': True,
            'min_amount': 0.01,
            'max_amount': 100000.00,
            'processing_time': 'immediate',
            'fees': {
                'percentage': 0.99,
                'fixed': 0.00
            }
        },
        'boleto': {
            'enabled': True,
            'min_amount': 5.00,
            'max_amount': 50000.00,
            'processing_time': '1-2 business days',
            'expiration_days': 3,
            'fees': {
                'percentage': 0.00,
                'fixed': 3.50
            }
        }
    }
    
    return jsonify({
        'success': True,
        'data': methods
    })

@payment_bp.route('/api/v1/payment/create', methods=['POST'])
def create_payment():
    """Cria uma nova transação de pagamento"""
    try:
        data = request.get_json()
        
        # Validação dos dados obrigatórios
        required_fields = ['amount', 'currency', 'payment_method', 'customer']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Campo obrigatório: {field}'
                }), 400
        
        # Validação do valor
        amount = float(data['amount'])
        if amount <= 0:
            return jsonify({
                'success': False,
                'error': 'Valor deve ser maior que zero'
            }), 400
        
        # Gerar ID da transação
        transaction_id = f"tx_{uuid.uuid4().hex[:16]}"
        
        # Dados base da transação
        transaction = {
            'id': transaction_id,
            'amount': amount,
            'currency': data['currency'],
            'payment_method': data['payment_method'],
            'customer': data['customer'],
            'status': 'pending',
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat(),
            'metadata': data.get('metadata', {})
        }
        
        # Processar baseado no método de pagamento
        if data['payment_method'] in ['credit_card', 'debit_card']:
            result = process_card_payment(transaction, data)
        elif data['payment_method'] == 'pix':
            result = process_pix_payment(transaction, data)
        elif data['payment_method'] == 'boleto':
            result = process_boleto_payment(transaction, data)
        else:
            return jsonify({
                'success': False,
                'error': 'Método de pagamento não suportado'
            }), 400
        
        # Salvar transação
        transactions_db[transaction_id] = transaction
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Erro interno: {str(e)}'
        }), 500

def process_card_payment(transaction, data):
    """Processa pagamento com cartão"""
    card_data = data.get('card', {})
    
    # Validação dos dados do cartão
    required_card_fields = ['number', 'exp_month', 'exp_year', 'cvc', 'holder_name']
    for field in required_card_fields:
        if field not in card_data:
            return {
                'success': False,
                'error': f'Dados do cartão incompletos: {field}'
            }
    
    # Validação do número do cartão (Luhn algorithm)
    if not validate_card_number(card_data['number']):
        return {
            'success': False,
            'error': 'Número do cartão inválido'
        }
    
    # Tokenizar dados do cartão (em produção, usar tokenização real)
    card_token = generate_card_token(card_data)
    
    # Simular processamento (em produção, integrar com adquirente)
    import random
    success_rate = 0.95  # 95% de aprovação para simulação
    
    if random.random() < success_rate:
        transaction['status'] = 'approved'
        transaction['authorization_code'] = f"AUTH_{uuid.uuid4().hex[:8].upper()}"
        transaction['card_token'] = card_token
        transaction['card_last4'] = card_data['number'][-4:]
        transaction['card_brand'] = detect_card_brand(card_data['number'])
        
        return {
            'success': True,
            'data': {
                'transaction_id': transaction['id'],
                'status': 'approved',
                'authorization_code': transaction['authorization_code'],
                'amount': transaction['amount'],
                'currency': transaction['currency'],
                'card_last4': transaction['card_last4'],
                'card_brand': transaction['card_brand']
            }
        }
    else:
        transaction['status'] = 'declined'
        transaction['decline_reason'] = 'Cartão recusado pelo banco emissor'
        
        return {
            'success': False,
            'error': 'Pagamento recusado',
            'data': {
                'transaction_id': transaction['id'],
                'status': 'declined',
                'decline_reason': transaction['decline_reason']
            }
        }

def process_pix_payment(transaction, data):
    """Processa pagamento PIX"""
    # Gerar chave PIX e QR Code
    pix_key = MERCHANT_CONFIG['pix_key']
    
    # Dados do PIX (formato simplificado)
    pix_data = {
        'key': pix_key,
        'amount': transaction['amount'],
        'description': data.get('description', f"Pagamento {transaction['id']}"),
        'transaction_id': transaction['id'],
        'expiration': (datetime.utcnow() + timedelta(minutes=30)).isoformat()
    }
    
    # Gerar QR Code
    qr_code_data = generate_pix_qr_code(pix_data)
    
    # Salvar dados do PIX
    pix_payments_db[transaction['id']] = {
        'pix_data': pix_data,
        'qr_code': qr_code_data,
        'status': 'waiting_payment'
    }
    
    transaction['status'] = 'waiting_payment'
    transaction['payment_data'] = {
        'pix_key': pix_key,
        'qr_code': qr_code_data,
        'expiration': pix_data['expiration']
    }
    
    return {
        'success': True,
        'data': {
            'transaction_id': transaction['id'],
            'status': 'waiting_payment',
            'payment_method': 'pix',
            'pix_key': pix_key,
            'qr_code': qr_code_data,
            'amount': transaction['amount'],
            'currency': transaction['currency'],
            'expiration': pix_data['expiration']
        }
    }

def process_boleto_payment(transaction, data):
    """Processa pagamento por boleto"""
    # Gerar dados do boleto
    due_date = datetime.utcnow() + timedelta(days=3)
    
    boleto_data = {
        'barcode': generate_boleto_barcode(transaction),
        'digitable_line': generate_digitable_line(transaction),
        'due_date': due_date.isoformat(),
        'amount': transaction['amount'],
        'recipient': MERCHANT_CONFIG['merchant_id'],
        'payer': data['customer']
    }
    
    # Salvar dados do boleto
    boleto_payments_db[transaction['id']] = {
        'boleto_data': boleto_data,
        'status': 'waiting_payment'
    }
    
    transaction['status'] = 'waiting_payment'
    transaction['payment_data'] = boleto_data
    
    return {
        'success': True,
        'data': {
            'transaction_id': transaction['id'],
            'status': 'waiting_payment',
            'payment_method': 'boleto',
            'barcode': boleto_data['barcode'],
            'digitable_line': boleto_data['digitable_line'],
            'due_date': boleto_data['due_date'],
            'amount': transaction['amount'],
            'currency': transaction['currency'],
            'pdf_url': f"/api/v1/boleto/{transaction['id']}/pdf"
        }
    }

@payment_bp.route('/api/v1/payment/<transaction_id>', methods=['GET'])
def get_payment_status(transaction_id):
    """Consulta o status de uma transação"""
    if transaction_id not in transactions_db:
        return jsonify({
            'success': False,
            'error': 'Transação não encontrada'
        }), 404
    
    transaction = transactions_db[transaction_id]
    
    return jsonify({
        'success': True,
        'data': {
            'transaction_id': transaction['id'],
            'status': transaction['status'],
            'amount': transaction['amount'],
            'currency': transaction['currency'],
            'payment_method': transaction['payment_method'],
            'created_at': transaction['created_at'],
            'updated_at': transaction['updated_at']
        }
    })

@payment_bp.route('/api/v1/payment/<transaction_id>/capture', methods=['POST'])
def capture_payment(transaction_id):
    """Captura um pagamento pré-autorizado"""
    if transaction_id not in transactions_db:
        return jsonify({
            'success': False,
            'error': 'Transação não encontrada'
        }), 404
    
    transaction = transactions_db[transaction_id]
    
    if transaction['status'] != 'authorized':
        return jsonify({
            'success': False,
            'error': 'Transação não pode ser capturada'
        }), 400
    
    # Simular captura
    transaction['status'] = 'captured'
    transaction['captured_at'] = datetime.utcnow().isoformat()
    transaction['updated_at'] = datetime.utcnow().isoformat()
    
    return jsonify({
        'success': True,
        'data': {
            'transaction_id': transaction['id'],
            'status': 'captured',
            'captured_at': transaction['captured_at']
        }
    })

@payment_bp.route('/api/v1/payment/<transaction_id>/refund', methods=['POST'])
def refund_payment(transaction_id):
    """Estorna um pagamento"""
    if transaction_id not in transactions_db:
        return jsonify({
            'success': False,
            'error': 'Transação não encontrada'
        }), 404
    
    transaction = transactions_db[transaction_id]
    
    if transaction['status'] not in ['captured', 'approved']:
        return jsonify({
            'success': False,
            'error': 'Transação não pode ser estornada'
        }), 400
    
    data = request.get_json()
    refund_amount = data.get('amount', transaction['amount'])
    
    if refund_amount > transaction['amount']:
        return jsonify({
            'success': False,
            'error': 'Valor do estorno maior que o valor da transação'
        }), 400
    
    # Gerar ID do estorno
    refund_id = f"ref_{uuid.uuid4().hex[:16]}"
    
    # Simular estorno
    refund = {
        'id': refund_id,
        'transaction_id': transaction_id,
        'amount': refund_amount,
        'status': 'approved',
        'created_at': datetime.utcnow().isoformat()
    }
    
    # Atualizar status da transação
    if refund_amount == transaction['amount']:
        transaction['status'] = 'refunded'
    else:
        transaction['status'] = 'partially_refunded'
    
    transaction['updated_at'] = datetime.utcnow().isoformat()
    
    return jsonify({
        'success': True,
        'data': refund
    })

@payment_bp.route('/api/v1/webhook/pix', methods=['POST'])
def pix_webhook():
    """Webhook para notificações PIX"""
    try:
        data = request.get_json()
        
        # Validar assinatura do webhook (em produção)
        if not validate_webhook_signature(request):
            return jsonify({'error': 'Assinatura inválida'}), 401
        
        transaction_id = data.get('transaction_id')
        status = data.get('status')
        
        if transaction_id in transactions_db:
            transaction = transactions_db[transaction_id]
            transaction['status'] = status
            transaction['updated_at'] = datetime.utcnow().isoformat()
            
            if status == 'paid':
                transaction['paid_at'] = datetime.utcnow().isoformat()
        
        return jsonify({'success': True})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Funções auxiliares

def validate_card_number(number):
    """Valida número do cartão usando algoritmo de Luhn"""
    number = re.sub(r'\D', '', number)
    
    if len(number) < 13 or len(number) > 19:
        return False
    
    total = 0
    reverse_digits = number[::-1]
    
    for i, digit in enumerate(reverse_digits):
        n = int(digit)
        if i % 2 == 1:
            n *= 2
            if n > 9:
                n = (n // 10) + (n % 10)
        total += n
    
    return total % 10 == 0

def detect_card_brand(number):
    """Detecta a bandeira do cartão"""
    number = re.sub(r'\D', '', number)
    
    if number.startswith('4'):
        return 'visa'
    elif number.startswith(('51', '52', '53', '54', '55')):
        return 'mastercard'
    elif number.startswith(('34', '37')):
        return 'amex'
    elif number.startswith(('4011', '4312', '4389', '4514', '4573', '6277', '6362', '6363')):
        return 'elo'
    else:
        return 'unknown'

def generate_card_token(card_data):
    """Gera token para dados do cartão"""
    # Em produção, usar tokenização real com HSM
    card_hash = hashlib.sha256(
        f"{card_data['number']}{card_data['exp_month']}{card_data['exp_year']}".encode()
    ).hexdigest()
    return f"tok_{card_hash[:16]}"

def generate_pix_qr_code(pix_data):
    """Gera QR Code PIX"""
    # Formato simplificado do PIX (em produção, usar formato oficial)
    pix_string = f"PIX|{pix_data['key']}|{pix_data['amount']}|{pix_data['transaction_id']}"
    
    # Gerar QR Code
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(pix_string)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Converter para base64
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    img_str = b64.b64encode(buffer.getvalue()).decode()
    
    return f"data:image/png;base64,{img_str}"

def generate_boleto_barcode(transaction):
    """Gera código de barras do boleto"""
    # Formato simplificado (em produção, usar formato oficial)
    return f"00190000090{int(transaction['amount'] * 100):010d}64{datetime.utcnow().strftime('%y%m%d')}"

def generate_digitable_line(transaction):
    """Gera linha digitável do boleto"""
    barcode = generate_boleto_barcode(transaction)
    # Simplificado - em produção, calcular dígitos verificadores
    return f"{barcode[:5]}.{barcode[5:10]} {barcode[10:15]}.{barcode[15:21]} {barcode[21:26]}.{barcode[26:32]} {barcode[32]} {barcode[33:]}"

def validate_webhook_signature(request):
    """Valida assinatura do webhook"""
    # Em produção, implementar validação real
    signature = request.headers.get('X-Webhook-Signature')
    if not signature:
        return False
    
    # Validar HMAC
    expected_signature = hmac.new(
        MERCHANT_CONFIG['webhook_secret'].encode(),
        request.get_data(),
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(signature, expected_signature)

@payment_bp.route('/api/v1/payment/simulate/pix/<transaction_id>', methods=['POST'])
def simulate_pix_payment(transaction_id):
    """Simula recebimento de pagamento PIX (apenas para testes)"""
    if transaction_id not in transactions_db:
        return jsonify({
            'success': False,
            'error': 'Transação não encontrada'
        }), 404
    
    transaction = transactions_db[transaction_id]
    
    if transaction['payment_method'] != 'pix':
        return jsonify({
            'success': False,
            'error': 'Transação não é PIX'
        }), 400
    
    transaction['status'] = 'paid'
    transaction['paid_at'] = datetime.utcnow().isoformat()
    transaction['updated_at'] = datetime.utcnow().isoformat()
    
    return jsonify({
        'success': True,
        'data': {
            'transaction_id': transaction['id'],
            'status': 'paid',
            'paid_at': transaction['paid_at']
        }
    })

@payment_bp.route('/api/v1/payment/simulate/boleto/<transaction_id>', methods=['POST'])
def simulate_boleto_payment(transaction_id):
    """Simula recebimento de pagamento por boleto (apenas para testes)"""
    if transaction_id not in transactions_db:
        return jsonify({
            'success': False,
            'error': 'Transação não encontrada'
        }), 404
    
    transaction = transactions_db[transaction_id]
    
    if transaction['payment_method'] != 'boleto':
        return jsonify({
            'success': False,
            'error': 'Transação não é boleto'
        }), 400
    
    transaction['status'] = 'paid'
    transaction['paid_at'] = datetime.utcnow().isoformat()
    transaction['updated_at'] = datetime.utcnow().isoformat()
    
    return jsonify({
        'success': True,
        'data': {
            'transaction_id': transaction['id'],
            'status': 'paid',
            'paid_at': transaction['paid_at']
        }
    })

