// Central Chart.js registration so individual chart components stay lean.
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement,
  Filler,
} from 'chart.js'

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement,
  Filler,
)

ChartJS.defaults.font.family = 'Inter, ui-sans-serif, system-ui, sans-serif'
ChartJS.defaults.color = '#94a3b8'
ChartJS.defaults.plugins.legend.labels.boxWidth = 10
ChartJS.defaults.plugins.legend.labels.usePointStyle = true

export { ChartJS }
