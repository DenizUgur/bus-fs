/**
 * @author Deniz Ugur <deniz343@gmail.com>
 */
import React from "react";
import styled from "styled-components";

export const Docs = styled.div`
	* {
		all: revert;
	}
`;

export default function documentation() {
	return (
		<Docs>
			<h2>A. Heroku Rehberi</h2>
			<p>
				<b>A1. Dosya Yükleme:</b> Ödev veya sınav dosyası yüklerken
				aşağıdaki adımlar izlenir.
			</p>
			<ol>
				<li>Dashboard -&gt; File Access sayfasına gidilir.</li>
				<li>Dosya yoksa Create New butonu ile oluşturulur.</li>
				<ul>
					<li>
						<b>Name:</b> Linkte f/ kısmından sonra ve dosya adında
						öğrenci numarasından sonra gözükecek olan dosya ismi.
					</li>
					<li>
						<b>Level:</b> Dosyayı indirebilmek için gereken minimum
						level (asistanlar için 150, öğrenciler için 0).
					</li>
					<li>
						<b>Enabled:</b> Dosya indirilebilir.
					</li>
					<li>
						<b>Encrypt:</b> Dosyayı açmak için şifre gerekir
						(Password kısmı).
					</li>
					<li>
						<b>Onetime:</b> Dosya bir kez indirilir.
					</li>
					<li>
						<b>Vba Password:</b> Start butonuna basıldığında
						auto-generated şifre sorulur (sınavlardaki 2. şifre -
						indirdikten sonra çıkan sayfada gözükür).
					</li>
				</ul>
				3. Upload File sayfasında macro-enabled (.xlsm) ve macro-free
				(.xlsx) dosyalar yüklenir.
			</ol>
			<p>
				<b>A2. Öğrenci ve Asistan Listesi Güncelleme</b>
			</p>
			<ol>
				<li>Dashboard -&gt; User sayfasına gidilir.</li>
				<li>
					Öğrencileri güncellemek için Update Students butonuna
					basılıp "email" ve "student_id" sütunlarının (A1:A2) bulunduğu bir
					excel dosyası yüklenir. Verify'a basıldığında değişim
					görünecektir.
				</li>
				<li>
					Asistanları güncellemek için Update Assistants butonuna
					basılıp "email", "student_id", "displayName" ve "level"
					sütunlarının (A1:A4) bulunduğu bir excel yüklenir.
				</li>
			</ol>
			<p>
				<b>Not:</b> Level'lar aşağıdaki gibi belirlenir.
			</p>
			<ul>
				<li>0: Ögrenci (otomatik)</li>
				<li>150: Asistan</li>
				<li>200: Manager</li>
				<li>300: Super user - BM</li>
			</ul>
			<h2>B. Server Teslimi</h2>
			<p>
				<b>B1. Heroku:</b> Back Manager (BM) tarafından teslim edilir.
				Aylık 1000 Heroku saati için ücretsizdir. Eski öğrenciler boş
				excel yüklenerek silinebilir, user access kayıtları da otomatik
				olarak silinecektir.
			</p>
			<p>
				<b>B2. Amazon S3:</b> Dosyaların saklanmasında kullanılır. İlk 1
				yıl için ücretsizdir, billing plan takip edilmelidir. Aşağıdaki
				adımlar izlenir.
			</p>
			<ol>
				<li>
					<a href="https://aws.amazon.com">https://aws.amazon.com</a>{" "}
					sayfasına gidilir.
				</li>
				<li>Hesap oluşturulup root user olarak oturum açılır.</li>
				<li>
					<a href="https://s3.console.aws.amazon.com/s3/home">
						https://s3.console.aws.amazon.com/s3/home
					</a>{" "}
					sayfasından bucket oluşturulur.
				</li>
				<ul>
					<li>
						Bucket Name: bus-fs-bucket-sp22 (değişebilir, daha sonra
						kullanılacaktır)
					</li>
					<li>AWS Region: EU (Frankfurt olabilir).</li>
				</ul>
				<li>
					User -&gt; Security credentials -&gt; Access keys -&gt;
					Create access key. (oluşan 2 key daha sonra
					kullanılacaktır.)
				</li>
			</ol>
			<p>
				<b>B3. Azure:</b> Authentication amacıyla kullanılır. Yeni BM'in
				emaili server sorumlusu tarafından listeye eklenir, hiçbir şeye
				dokunulmamalıdır.
			</p>
			<p>
				<b>B4. Server sıfırlama</b>
			</p>
			<ol>
				<li>
					Dosyaları silmek için aşağıdaki komutlar çalıştırılır.{" "}
					<b>
						<i>(*)</i>
					</b>
					<ul>
						<li>
							<code>brew install postgresql</code>
						</li>
						<li>
							<code>heroku pg:psql</code>
						</li>
						<li>
							<code>\dt;</code>
						</li>
						<li>
							<code>select * from file_access;</code>
						</li>
						<li>
							<code>delete from file_access;</code>
						</li>
						<li>
							<code>exit;</code>
						</li>
						<li>
							<code>heroku ps:restart</code>
						</li>
						<li>
							<code>heroku logs --tail</code>
						</li>
					</ul>
				</li>
				<li>
					Yeni bucket adı ve S3 key'leri tanımlanır.{" "}
					<b>
						<i>(*)</i>
					</b>
				</li>
				<p className="code">
					heroku config:set AWS_ACCESS_KEY_ID=...
					AWS_SECRET_ACCESS_KEY=... S3_BUCKET_NAME=bus-fs-bucket-sp22
				</p>
			</ol>
			<p>
				<b>B5. Proje Dosyalarına ve Database'e Erişim</b>
			</p>
			<ol>
				<li>
					heroku.com Deploy kısmında anlatıldığı gibi repository
					klonlanır.
				</li>
				<li>
					.env ve nodemon.json dosyaları webapp/server klasörüne
					atılır. Repo'ya pushlanmaz.
				</li>
				<li>
					Aşağıdaki komutlar çalıştırılır.{" "}
					<b>
						<i>(*)</i>
					</b>
					<ul>
						<li>
							<code>cd webapp/server</code>
						</li>
						<li>
							<code>npm ci</code>
						</li>
						<li>
							<code>brew install redis</code>
						</li>
						<li>
							<code>brew install postgresql</code>
						</li>
						<li>
							<code>brew services start postgresql</code>
						</li>
						<li>
							<code>psql postgres</code>
						</li>
						<li>
							<code>create role "admin" login superuser;</code>
						</li>
						<li>
							<code>create database busfs;</code>
						</li>
						<li>
							<code>exit</code>
						</li>
						<li>
							<code>psql postgres -U admin -d busfs</code>
						</li>
						<li>
							<code>exit</code>
						</li>
						<li>
							<code>npm run start:dev</code>
						</li>
					</ul>
				</li>
			</ol>
			<p>
				<b>Not:</b> Updateler sırasında bakım moduna girmek için
				aşağıdaki komutlar çalıştırılır.{" "}
				<b>
					<i>(*)</i>
				</b>
			</p>
			<ul>
				<li>
					<code>heroku maintenance:on</code>
				</li>
				<li>
					<code>git push</code>
				</li>
				<li>
					<code>heroku maintenance:off</code>
				</li>
				<li>
					<code>heroku logs</code>
				</li>
			</ul>
			<p>
				<b>
					<i>(*)</i>
				</b>{" "}
				Mac terminal komutları verilmiştir. Windows için Git Bash
				kullanılmalıdır. PostgreSQL ve Redis manuel kurulmalıdır.
			</p>
			<p></p>
		</Docs>
	);
}
