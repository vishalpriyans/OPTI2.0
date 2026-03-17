"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, AlertTriangle, Clock, Users, Wrench } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ConflictDisplay } from "./conflict-display"
import { ConflictAnalysis } from "./conflict-detector"

interface ConflictAnalysisDashboardProps {
  conflicts: ConflictAnalysis
  onResolveConflicts: () => void
}

export function ConflictAnalysisDashboard({ conflicts, onResolveConflicts }: ConflictAnalysisDashboardProps) {
  const [isMinimized, setIsMinimized] = useState(true)

  const totalConflicts = conflicts.totalConflicts
  const criticalConflicts = conflicts.criticalConflicts

  return (
    <div className="control-tower-card space-y-6 p-6 border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-red-50">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-100">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-orange-800">Conflict Analysis</h2>
            <p className="text-sm text-orange-600">
              Real-time conflict detection and resolution recommendations
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Conflict Summary Badges */}
          <div className="flex items-center gap-2">
            {totalConflicts > 0 ? (
              <>
                <Badge variant="destructive" className="animate-pulse">
                  {totalConflicts} conflicts
                </Badge>
                {criticalConflicts > 0 && (
                  <Badge variant="outline" className="border-red-500 text-red-700">
                    {criticalConflicts} critical
                  </Badge>
                )}
              </>
            ) : (
              <Badge variant="default" className="bg-green-600">
                ✓ No conflicts
              </Badge>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2"
          >
            {isMinimized ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </Button>
        </div>
      </header>

      {!isMinimized && (
        <div className="space-y-6">
          {/* Conflict Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Group conflicts by type */}
            {(() => {
              const surgeonConflicts = conflicts.conflicts.filter(c => c.type === 'surgeon')
              const equipmentConflicts = conflicts.conflicts.filter(c => c.type === 'equipment')
              const timeConflicts = conflicts.conflicts.filter(c => c.type === 'time')
              const priorityConflicts = conflicts.conflicts.filter(c => c.type === 'priority')

              return (
                <>
                  <Card className="border-red-200 bg-red-50/50">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-red-700">
                          Time Conflicts
                        </CardTitle>
                        <Clock className="w-5 h-5 text-red-600" />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-2xl font-bold text-red-600">
                        {timeConflicts.length}
                      </div>
                      <p className="text-xs text-red-600 mt-1">
                        {timeConflicts.length > 0 ? "Cases with time conflicts" : "No time conflicts"}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-orange-200 bg-orange-50/50">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-orange-700">
                          Priority Issues
                        </CardTitle>
                        <AlertTriangle className="w-5 h-5 text-orange-600" />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-2xl font-bold text-orange-600">
                        {priorityConflicts.length}
                      </div>
                      <p className="text-xs text-orange-600 mt-1">
                        {priorityConflicts.length > 0 ? "Priority scheduling issues" : "No priority conflicts"}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-blue-200 bg-blue-50/50">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-blue-700">
                          Surgeon Conflicts
                        </CardTitle>
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-2xl font-bold text-blue-600">
                        {surgeonConflicts.length}
                      </div>
                      <p className="text-xs text-blue-600 mt-1">
                        {surgeonConflicts.length > 0 ? "Surgeon availability issues" : "No surgeon conflicts"}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-purple-200 bg-purple-50/50">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-purple-700">
                          Equipment Conflicts
                        </CardTitle>
                        <Wrench className="w-5 h-5 text-purple-600" />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-2xl font-bold text-purple-600">
                        {equipmentConflicts.length}
                      </div>
                      <p className="text-xs text-purple-600 mt-1">
                        {equipmentConflicts.length > 0 ? "Equipment availability issues" : "No equipment conflicts"}
                      </p>
                    </CardContent>
                  </Card>
                </>
              )
            })()}
          </div>

          {/* Detailed Conflict Analysis */}
          <ConflictDisplay 
            conflicts={conflicts}
            onResolveConflicts={onResolveConflicts}
          />
        </div>
      )}
    </div>
  )
}
