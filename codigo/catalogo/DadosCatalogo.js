/**
 * DADOS DO CATÁLOGO DIGITAL CACAU SHOW
 * Mapeamento das páginas, imagens de alta resolução e coordenadas dos produtos.
 */
export const DADOS_CATALOGO_PADRAO = {
    ciclo: "Ciclo 13 e 14",
    paginas: [
        {
            numero: 1,
            imagem: "https://img.cacaushow.com.br/banner/desktop/home-banner-principal.png",
            produtos: []
        },
        {
            numero: 2,
            imagem: "https://catalogo.cacaushow.com.br/assets/images/default-cover.jpg",
            produtos: [
                { id: "trufa-30g", nome: "Trufa 30g LaNut", preco: 5.29, x: 30, y: 40, w: 15, h: 10 },
                { id: "trufa-13g", nome: "Trufa 13.5g Tradicional", preco: 3.79, x: 65, y: 40, w: 15, h: 10 },
                { id: "tablete-20g", nome: "Tablete 20g LaCreme", preco: 5.29, x: 30, y: 70, w: 15, h: 10 },
                { id: "tablete-5g", nome: "Tablete 5g Mini", preco: 1.39, x: 65, y: 70, w: 15, h: 10 }
            ]
        },
        {
            numero: 3,
            imagem: "https://catalogo.cacaushow.com.br/assets/images/default-page.jpg",
            produtos: [
                { id: "lacreme-kids", nome: "LaCreme Kids", preco: 26.49, x: 35, y: 45, w: 20, h: 15 },
                { id: "lacreme-pistache", nome: "LaCreme Pistache", preco: 24.49, x: 65, y: 45, w: 20, h: 15 },
                { id: "lacreme-trad", nome: "LaCreme Tradicional", preco: 21.29, x: 50, y: 75, w: 20, h: 15 }
            ]
        }
    ]
};