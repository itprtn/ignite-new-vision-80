import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts"
import {
  Users, Mail, Calendar, Target, BarChart3, Calculator
} from "lucide-react"
import { CommercialAnalytics } from './CommercialAnalytics'
import { OriginAnalytics } from './analytics/OriginAnalytics'
import { BrevoAnalyticsDashboard } from './BrevoAnalyticsDashboard'
import { CommissionsAnalyticsTab } from './CommissionsAnalyticsTab'

interface AnalyticsTabProps {
  stats: any
  campaigns: any[]
  clients: any[]
  analyticsData: any
  contacts: any[]
  projets: any[]
  contrats: any[]
}


const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"]

export function AnalyticsTab({ 
  stats, 
  campaigns, 
  clients, 
  analyticsData, 
  contacts, 
  projets, 
  contrats 
}: AnalyticsTabProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState("7d")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Analytics & Insights</h2>
          <p className="text-muted-foreground mt-2">
            Analyse approfondie des performances marketing et commerciales
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
            En temps réel
          </Badge>
          <Button variant="outline" size="sm">
            <Calendar className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      <Tabs defaultValue="origins" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="origins" className="flex items-center space-x-2">
            <Target className="w-4 h-4" />
            <span>Analyse Origines</span>
          </TabsTrigger>
          <TabsTrigger value="commercial" className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Performance Commerciale</span>
          </TabsTrigger>
          <TabsTrigger value="commissions" className="flex items-center space-x-2">
            <Calculator className="w-4 h-4" />
            <span>Commissions</span>
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="flex items-center space-x-2">
            <Mail className="w-4 h-4" />
            <span>Campagnes</span>
          </TabsTrigger>
        </TabsList>


        <TabsContent value="origins">
          <OriginAnalytics 
            originData={analyticsData.originAnalytics || []}
            commercialData={analyticsData.commercialAnalytics || []}
          />
        </TabsContent>

        <TabsContent value="commercial">
          <CommercialAnalytics
            contacts={contacts}
            projets={projets}
            contrats={contrats}
          />
        </TabsContent>

        <TabsContent value="commissions" className="space-y-6">
           <div className="hero-section rounded-2xl p-6">
             <div className="text-center mb-6">
               <Calculator className="w-16 h-16 mx-auto mb-4 premun-ia-gradient" />
               <h3 className="text-2xl font-bold text-gray-900 mb-2">Analytics des Commissions</h3>
               <p className="text-gray-600">Tableau de bord complet des commissions d'assurance</p>
             </div>

             {/* Intégration du CommissionsAnalyticsTab */}
             <CommissionsAnalyticsTab />
           </div>
         </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
           {/* Brevo Analytics Dashboard */}
           <div className="hero-section rounded-2xl p-6">
             <div className="text-center mb-6">
               <Mail className="w-16 h-16 mx-auto mb-4 premun-ia-gradient" />
               <h3 className="text-2xl font-bold text-gray-900 mb-2">Analytics Brevo</h3>
               <p className="text-gray-600">Tableau de bord complet des performances email Brevo</p>
             </div>

             {/* Intégration du BrevoAnalyticsDashboard */}
             <BrevoAnalyticsDashboard />
           </div>
         </TabsContent>
      </Tabs>
    </div>
  )
}
