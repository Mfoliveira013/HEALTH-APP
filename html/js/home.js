console.log('home.js carregado');

// Funções para o cálculo de IMC
function toggleImcCalculator() {
    console.log('Toggle IMC Calculator chamado');
    const imcCalculator = document.getElementById("imc-calculator");
    if (imcCalculator) {
        const currentDisplay = imcCalculator.style.display;
        imcCalculator.style.display = currentDisplay === "none" ? "block" : "none";
        console.log('Display alterado para:', imcCalculator.style.display);
    } else {
        console.error('Elemento imc-calculator não encontrado');
    }
}

// Registrar água
async function registrarAgua() {
    const valor = parseFloat(document.getElementById('agua').value);
    const unidade = document.getElementById('unidadeAgua').value;

    if (isNaN(valor) || valor <= 0) {
        alert('Informe uma quantidade válida de água.');
        return;
    }

    const qntd_hid = unidade === 'ml' ? valor / 1000 : valor;
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Você precisa estar logado!');
        return;
    }

    try {
        const res = await fetch('http://localhost:3000/registro/hidratacao', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ qntd_hid }),
        });

        const data = await res.json();
        if (res.ok) {
            document.getElementById('resultadoAgua').textContent = data.message;
            document.getElementById('agua').value = '';
            atualizarResumo();
        } else {
            alert(data.message || 'Erro ao registrar hidratação.');
        }
    } catch (e) {
        alert('Erro ao conectar com o servidor.');
        console.error(e);
    }
}

// Registrar calorias
async function registrarCalorias() {
    const valor = parseInt(document.getElementById('calorias').value);

    if (isNaN(valor) || valor <= 0) {
        alert('Informe uma quantidade válida de calorias.');
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        alert('Você precisa estar logado!');
        return;
    }

    try {
        const res = await fetch('http://localhost:3000/registro/calorias', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ qntd_cal: valor }),
        });

        const data = await res.json();
        if (res.ok) {
            document.getElementById('resultadoCalorias').textContent = data.message;
            document.getElementById('calorias').value = '';
            atualizarResumo();
        } else {
            alert(data.message || 'Erro ao registrar calorias.');
        }
    } catch (e) {
        alert('Erro ao conectar com o servidor.');
        console.error(e);
    }
}

// Mostrar histórico
async function mostrarRegistros(tipo) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Você precisa estar logado!');
        return;
    }

    let url, titulo;
    if (tipo === 'agua') {
        url = 'http://localhost:3000/registro/hidratacao/historico';
        titulo = 'Histórico de Hidratação';
    } else if (tipo === 'calorias') {
        url = 'http://localhost:3000/registro/calorias/historico';
        titulo = 'Histórico de Calorias';
    } else {
        alert('Tipo inválido');
        return;
    }

    try {
        const res = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
            abrirModal(titulo, data.registros);
        } else {
            alert(data.message || 'Erro ao buscar histórico.');
        }
    } catch (e) {
        alert('Erro ao conectar com o servidor.');
        console.error(e);
    }
}

// Modal abrir/fechar
function abrirModal(titulo, registros) {
    document.getElementById('tituloModal').textContent = titulo;
    const lista = document.getElementById('listaRegistros');
    lista.innerHTML = '';

    if (!registros || registros.length === 0) {
        lista.innerHTML = '<li>Nenhum registro encontrado.</li>';
    } else {
        registros.forEach(r => {
            const li = document.createElement('li');
            li.textContent = `${r.data}: ${r.quantidade}`;
            lista.appendChild(li);
        });
    }

    document.getElementById('modal').style.display = 'block';
}

function fecharModal() {
    document.getElementById('modal').style.display = 'none';
}

window.onclick = function(event) {
    const modal = document.getElementById('modal');
    if (event.target === modal) {
        fecharModal();
    }
}

// Atualizar resumo do dia
async function atualizarResumo() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const res = await fetch('http://localhost:3000/registro/resumo', {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
            throw new Error('Erro ao obter resumo');
        }

        const data = await res.json();
        document.getElementById('totalAgua').textContent = ((data.totalAgua ?? 0) * 1000) + ' ml';
        document.getElementById('totalCalorias').textContent = (data.totalCalorias ?? 0) + ' calorias';

    } catch (error) {
        console.error('Erro ao atualizar resumo:', error);
    }
}

// Cálculo de IMC ao enviar o formulário
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded');
    const imcForm = document.getElementById("imcForm");
    if (imcForm) {
        imcForm.addEventListener("submit", function(event) {
            event.preventDefault();
            const pesoIMC = parseFloat(document.getElementById("pesoIMC").value);
            const alturaIMC = parseFloat(document.getElementById("alturaIMC").value);
            const imc = pesoIMC / (alturaIMC ** 2);
            const resultado = document.getElementById("resultadoIMC");
            const diagnostico = document.getElementById("diagnosticoIMC");

            if (isNaN(imc) || imc <= 0) {
                resultado.innerText = "Por favor, preencha todos os campos corretamente.";
                diagnostico.innerText = "";
                return;
            }

            resultado.innerText = `Seu IMC é: ${imc.toFixed(2)}`;
            
            if (imc < 18.5) {
                diagnostico.innerText = "Classificação: Abaixo do peso";
                diagnostico.style.color = "#ff6b6b";
            } else if (imc < 24.9) {
                diagnostico.innerText = "Classificação: Peso normal";
                diagnostico.style.color = "#51cf66";
            } else if (imc < 29.9) {
                diagnostico.innerText = "Classificação: Sobrepeso";
                diagnostico.style.color = "#ffd43b";
            } else if (imc < 34.9) {
                diagnostico.innerText = "Classificação: Obesidade Grau I";
                diagnostico.style.color = "#ff922b";
            } else if (imc < 39.9) {
                diagnostico.innerText = "Classificação: Obesidade Grau II";
                diagnostico.style.color = "#ff6b6b";
            } else {
                diagnostico.innerText = "Classificação: Obesidade Grau III";
                diagnostico.style.color = "#fa5252";
            }
        });
    } else {
        console.error('Formulário IMC não encontrado');
    }

    // Carregar resumo ao iniciar
    atualizarResumo();
});


//tabela nutricional


// Função para alternar a visibilidade da tabela nutricional
function toggleTabelaNutricional() {
  const tabelaNutricional = document.getElementById('tabelaNutricional');
  tabelaNutricional.style.display = tabelaNutricional.style.display === 'none' ? 'block' : 'none';
 
  // Carregar dados da tabela quando for aberta
  if (tabelaNutricional.style.display === 'block') {
      carregarTabelaNutricional();
  }
}

// Dados da tabela nutricional
const alimentos = [
  { nome: 'Arroz Branco Cozido', calorias: 130, proteinas: 2.7, carboidratos: 28.2, gorduras: 0.3 },
  { nome: 'Feijão Carioca Cozido', calorias: 76, proteinas: 4.8, carboidratos: 13.6, gorduras: 0.5 },
  { nome: 'Frango Grelhado', calorias: 165, proteinas: 31, carboidratos: 0, gorduras: 3.6 },
  { nome: 'Ovo Cozido', calorias: 155, proteinas: 12.6, carboidratos: 1.1, gorduras: 10.6 },
  { nome: 'Banana', calorias: 89, proteinas: 1.1, carboidratos: 22.8, gorduras: 0.3 },
  { nome: 'Maçã', calorias: 52, proteinas: 0.3, carboidratos: 13.8, gorduras: 0.2 },
  { nome: 'Leite Integral', calorias: 61, proteinas: 3.2, carboidratos: 4.8, gorduras: 3.3 },
  { nome: 'Pão Francês', calorias: 265, proteinas: 8.4, carboidratos: 50.2, gorduras: 3.1 },
  { nome: 'Queijo Minas', calorias: 321, proteinas: 21.2, carboidratos: 3.2, gorduras: 24.6 },
  { nome: 'Iogurte Natural', calorias: 59, proteinas: 3.5, carboidratos: 4.7, gorduras: 3.3 }
];

// Função para carregar a tabela nutricional
function carregarTabelaNutricional() {
  const tbody = document.getElementById('tabelaAlimentos');
  tbody.innerHTML = '';

  alimentos.forEach(alimento => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
          <td>${alimento.nome}</td>
          <td>100g</td>
          <td>${alimento.calorias} kcal</td>
          <td>${alimento.proteinas}g</td>
          <td>${alimento.carboidratos}g</td>
          <td>${alimento.gorduras}g</td>
      `;
      tbody.appendChild(tr);
  });
}

// Função para filtrar alimentos na tabela
function filtrarAlimentos() {
  const input = document.getElementById('searchAlimento');
  const filter = input.value.toLowerCase();
  const tbody = document.getElementById('tabelaAlimentos');
  const tr = tbody.getElementsByTagName('tr');

  for (let i = 0; i < tr.length; i++) {
      const td = tr[i].getElementsByTagName('td')[0];
      if (td) {
          const txtValue = td.textContent || td.innerText;
          if (txtValue.toLowerCase().indexOf(filter) > -1) {
              tr[i].style.display = '';
          } else {
              tr[i].style.display = 'none';
          }
      }
  }
}