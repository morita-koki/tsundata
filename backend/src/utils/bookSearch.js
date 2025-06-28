import axios from 'axios';
import { JSDOM } from 'jsdom';

export async function searchBookByISBN(isbn) {
  console.log(`📚 Starting book search for ISBN: ${isbn}`);
  let bookData = null;

  try {
    console.log('🔍 Trying NDL API...');
    bookData = await searchWithNDL(isbn);
    if (bookData) {
      console.log('✅ Book found via NDL API:', bookData.title);
      return bookData;
    }
    console.log('❌ NDL API returned no results');
  } catch (error) {
    console.log('❌ NDL API search failed:', error.message);
  }

  try {
    console.log('🔍 Trying Google Books API...');
    bookData = await searchWithGoogleBooks(isbn);
    if (bookData) {
      console.log('✅ Book found via Google Books API:', bookData.title);
      return bookData;
    }
    console.log('❌ Google Books API returned no results');
  } catch (error) {
    console.log('❌ Google Books API search failed:', error.message);
  }

  console.log('❌ No book found in any API');
  throw new Error('Book not found in any API');
}

async function searchWithNDL(isbn) {
  console.log(`📖 NDL API search for ISBN: ${isbn}`);
  const response = await axios.get('https://iss.ndl.go.jp/api/sru', {
    params: {
      operation: 'searchRetrieve',
      version: '1.2',
      recordSchema: 'dcndl',
      onlyBib: 'true',
      recordPacking: 'xml',
      query: `isbn="${isbn}" AND dpid=iss-ndl-opac`,
      maximumRecords: 1
    }
  });

  console.log(`📊 NDL API response status: ${response.status}`);
  
  // XMLレスポンスをログ出力してデバッグ
  console.log('🔍 Raw NDL API response:', response.data.substring(0, 1000) + '...');
  
  const dom = new JSDOM(response.data, { contentType: 'text/xml' });
  const xmlDoc = dom.window.document;
  
  const records = xmlDoc.getElementsByTagName('recordData');
  console.log(`📚 NDL API found ${records.length} records`);
  
  if (records.length > 0) {
    console.log('🔍 First record content:', records[0].innerHTML.substring(0, 500) + '...');
    
    // 利用可能なすべての要素をリストアップ
    const allElements = records[0].getElementsByTagName('*');
    console.log('🔍 Available elements in record:');
    for (let i = 0; i < Math.min(allElements.length, 20); i++) {
      const element = allElements[i];
      if (element.textContent && element.textContent.trim()) {
        console.log(`  - ${element.tagName}: "${element.textContent.substring(0, 50)}${element.textContent.length > 50 ? '...' : ''}"`);
      }
    }
  }
  
  if (records.length === 0) {
    return null;
  }

  const record = records[0];
  
  const getElementText = (tagNames) => {
    // 複数の要素名を試す
    const nameArray = Array.isArray(tagNames) ? tagNames : [tagNames];
    
    for (const tagName of nameArray) {
      const elements = record.getElementsByTagName(tagName);
      if (elements.length > 0 && elements[0].textContent) {
        console.log(`✅ Found element: ${tagName} = "${elements[0].textContent}"`);
        return elements[0].textContent;
      }
    }
    
    console.log(`❌ Could not find any of: ${nameArray.join(', ')}`);
    return null;
  };

  // dcndlスキーマの要素名を使用
  const title = getElementText(['dcterms:title', 'dc:title']);
  const creator = getElementText(['dc:creator', 'dcterms:creator']);  
  const publisher = getElementText(['dc:publisher', 'dcterms:publisher']);
  const date = getElementText(['dcterms:issued', 'dc:date']);
  const description = getElementText(['dcndl:description', 'dc:description', 'dcterms:abstract']);
  const extent = getElementText(['dcterms:extent', 'dc:extent']);
  
  // 価格情報を取得
  const priceInfo = getElementText(['dcndl:price', 'dc:price']);
  
  // シリーズ情報（文庫情報）を取得
  const series = getElementText(['dcndl:series', 'dcterms:isPartOf', 'dc:relation']);

  // タイトルから読み仮名部分を除去
  let cleanTitle = title;
  if (title) {
    // 改行や余分な空白を除去し、最初の行（漢字部分）のみを取得
    cleanTitle = title.split('\n')[0].trim();
  }

  console.log(`📖 NDL parsed data: title="${cleanTitle}", author="${creator}", publisher="${publisher}", price="${priceInfo}", series="${series}"`);

  // 出版社情報を他の要素からも探す
  let actualPublisher = publisher;
  console.log(`🔍 Initial publisher: "${actualPublisher}"`);
  
  if (!actualPublisher || actualPublisher === 'JP') {
    // ログから見える可能性のある出版社要素を順次試す
    const publisherCandidates = ['dc:publisher', 'dcndl:publisher', 'dcterms:publisher'];
    
    for (const candidate of publisherCandidates) {
      const candidateValue = getElementText([candidate]);
      console.log(`🔍 Trying ${candidate}: "${candidateValue}"`);
      if (candidateValue && candidateValue !== 'JP') {
        actualPublisher = candidateValue;
        break;
      }
    }
    
    // まだ見つからない場合、ログに表示された他の要素も確認
    if (!actualPublisher || actualPublisher === 'JP') {
      console.log('🔍 Publisher not found in standard elements, checking all available elements...');
      const allElements = record.getElementsByTagName('*');
      for (let i = 0; i < allElements.length; i++) {
        const element = allElements[i];
        const tagName = element.tagName;
        const content = element.textContent;
        
        // 出版社らしい文字列を含む要素を探す
        if (content && content.includes('書房') || content.includes('出版') || content.includes('社')) {
          console.log(`🎯 Found potential publisher in ${tagName}: "${content}"`);
          actualPublisher = content;
          break;
        }
      }
    }
  }

  // 出版社名をクリーンアップ（読み仮名や住所を除去）
  let cleanPublisher = actualPublisher;
  if (actualPublisher) {
    // より詳細なクリーンアップ処理
    cleanPublisher = actualPublisher
      .split('\n')[0]  // 最初の行のみ
      .trim()
      .split(/\s+/)[0] // 空白（半角・全角）で分割して最初の部分のみ
      .replace(/[ア-ン\s]+/g, '') // カタカナ読み仮名と空白を除去
      .replace(/東京|大阪|京都|名古屋|福岡|札幌|仙台|広島|神戸|横浜|愛知|兵庫|千葉|埼玉|神奈川/g, '') // 都道府県名を除去
      .replace(/区|市|町|村|都|府|県/g, '') // 行政区分を除去
      .replace(/株式会社|有限会社|合同会社|合資会社|合名会社/g, '') // 会社形態を除去
      .replace(/[0-9\-]/g, '') // 数字とハイフンを除去
      .trim();
    
    // 空になった場合は元の値の最初の意味のある部分を使用
    if (!cleanPublisher && actualPublisher) {
      const parts = actualPublisher.split(/[\s\n]+/);
      cleanPublisher = parts.find(part => part.length > 1 && !/^[ア-ン]+$/.test(part)) || parts[0];
    }
    
    console.log(`🏢 Publisher cleaned: "${actualPublisher}" -> "${cleanPublisher}"`);
  }

  let pageCount = null;
  if (extent) {
    const pageMatch = extent.match(/(\d+)p/);
    if (pageMatch) {
      pageCount = parseInt(pageMatch[1]);
    }
  }

  // 価格を数値に変換（円マークや文字を除去）
  let price = null;
  if (priceInfo) {
    // "720円" や "1200円(税込)" などから数値を抽出
    const priceMatch = priceInfo.match(/(\d+)/);
    if (priceMatch) {
      price = parseInt(priceMatch[1]);
    }
    console.log(`💰 Price extracted: "${priceInfo}" -> ${price}`);
  }

  if (!cleanTitle || cleanTitle.trim() === '' || cleanTitle === 'Unknown Title') {
    console.log('❌ NDL API: Title is missing or unknown');
    return null;
  }

  if (!creator || creator.trim() === '' || creator === 'Unknown Author') {
    console.log('❌ NDL API: Author is missing or unknown');
    return null;
  }

  const bookData = {
    isbn,
    title: cleanTitle.trim(),
    author: creator.trim(),
    publisher: cleanPublisher ? cleanPublisher.trim() : null,
    publishedDate: date || null,
    description: description || null,
    pageCount: pageCount,
    thumbnail: null,
    price: price,
    series: series ? series.trim() : null,
    source: 'NDL'
  };

  console.log(`✅ NDL final book data:`, bookData);
  return bookData;
}

async function searchWithGoogleBooks(isbn) {
  if (!process.env.GOOGLE_BOOKS_API_KEY) {
    console.log('❌ Google Books API key not configured');
    throw new Error('Google Books API key not configured');
  }

  console.log(`🔍 Google Books API search for ISBN: ${isbn}`);
  const response = await axios.get(
    `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&key=${process.env.GOOGLE_BOOKS_API_KEY}`
  );

  console.log(`📊 Google Books API response: ${response.data.totalItems} items found`);

  if (response.data.totalItems === 0) {
    return null;
  }

  const bookData = response.data.items[0].volumeInfo;
  const saleInfo = response.data.items[0].saleInfo;

  console.log(`📖 Google Books parsed data: title="${bookData.title}", authors="${bookData.authors}"`);

  const title = bookData.title;
  const authors = bookData.authors ? bookData.authors.join(', ') : null;
  const rawPublisher = bookData.publisher;

  if (!title || title.trim() === '' || title === 'Unknown Title') {
    console.log('❌ Google Books API: Title is missing or unknown');
    return null;
  }

  if (!authors || authors.trim() === '' || authors === 'Unknown Author') {
    console.log('❌ Google Books API: Author is missing or unknown');
    return null;
  }

  // 出版社名をクリーンアップ
  let cleanPublisher = rawPublisher;
  if (rawPublisher) {
    // より詳細なクリーンアップ処理
    cleanPublisher = rawPublisher
      .split('\n')[0]  // 最初の行のみ
      .trim()
      .split(/\s+/)[0] // 空白（半角・全角）で分割して最初の部分のみ
      .replace(/[ア-ン\s]+/g, '') // カタカナ読み仮名と空白を除去
      .replace(/東京|大阪|京都|名古屋|福岡|札幌|仙台|広島|神戸|横浜|愛知|兵庫|千葉|埼玉|神奈川/g, '') // 都道府県名を除去
      .replace(/区|市|町|村|都|府|県/g, '') // 行政区分を除去
      .replace(/株式会社|有限会社|合同会社|合資会社|合名会社/g, '') // 会社形態を除去
      .replace(/[0-9\-]/g, '') // 数字とハイフンを除去
      .trim();
    
    // 空になった場合は元の値の最初の意味のある部分を使用
    if (!cleanPublisher && rawPublisher) {
      const parts = rawPublisher.split(/[\s\n]+/);
      cleanPublisher = parts.find(part => part.length > 1 && !/^[ア-ン]+$/.test(part)) || parts[0];
    }
    
    console.log(`🏢 Google Books Publisher cleaned: "${rawPublisher}" -> "${cleanPublisher}"`);
  }

  const result = {
    isbn,
    title: title.trim(),
    author: authors.trim(),
    publisher: cleanPublisher || null,
    publishedDate: bookData.publishedDate || null,
    description: bookData.description || null,
    pageCount: bookData.pageCount || null,
    thumbnail: null,
    price: saleInfo?.listPrice?.amount || null,
    series: null,
    source: 'Google Books'
  };

  console.log(`✅ Google Books final book data:`, result);
  return result;
}