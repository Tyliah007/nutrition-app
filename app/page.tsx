// app/page.tsx
import FoodApp from './components/FoodApp';
import styles from "./page.module.css";


export default function Home() {
  return (<FoodApp />);
}

<html>
  <div className={styles.container}>
    <main className={styles.main}>  
      <h1 className={styles.title}>
        Welcome to Food & Nutrition Analysis
      </h1>
      <p className={styles.description}>
        Explore food data and perform nutritional analysis using our interactive tools.
      </p>
      <div className={styles.grid}>
        <a href="/foods" className={styles.card}>
          <h2>Food Database &rarr;</h2>
          <p>Search and browse foods from the USDA FoodData Central database.</p>
        </a>
        <a href="/analytics" className={styles.card}>
          <h2>Analytics &rarr;</h2>
          <p>Perform sensitivity analysis and view summary statistics on nutritional data.</p>
        </a>
      </div>
    </main>
  </div>
</html>
