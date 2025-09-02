import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Avatar, AvatarFallback } from './ui/avatar'
import { Badge } from './ui/badge'
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User,
  ChefHat,
  BookOpen,
  Utensils,
  Clock,
  Lightbulb
} from 'lucide-react'

interface Message {
  id: string
  content: string
  sender: 'user' | 'bot'
  timestamp: Date
  type?: 'text' | 'suggestion'
}

export function ChatAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hello! I'm your ACWhisk culinary assistant. I'm here to help you with cooking questions, recipe suggestions, and platform guidance. How can I assist you today?",
      sender: 'bot',
      timestamp: new Date(),
      type: 'text'
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const quickSuggestions = [
    { icon: ChefHat, text: "Recipe suggestions", category: "recipes" },
    { icon: BookOpen, text: "Cooking techniques", category: "techniques" },
    { icon: Utensils, text: "Ingredient substitutions", category: "ingredients" },
    { icon: Clock, text: "Meal planning tips", category: "planning" },
    { icon: Lightbulb, text: "Kitchen tips", category: "tips" }
  ]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const generateBotResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase()
    
    // Recipe suggestions
    if (message.includes('recipe') || message.includes('cook') || message.includes('make')) {
      const recipes = [
        "Try making a classic Pasta Carbonara - it's creamy, delicious, and only takes 20 minutes!",
        "How about a hearty Chicken Stir-fry with vegetables? Perfect for a quick weeknight dinner.",
        "Consider making homemade bread - it's therapeutic and fills your kitchen with amazing aromas!",
        "A fresh Caprese salad with tomatoes, mozzarella, and basil is perfect for summer."
      ]
      return recipes[Math.floor(Math.random() * recipes.length)]
    }
    
    // Cooking techniques
    if (message.includes('technique') || message.includes('how to') || message.includes('method')) {
      const techniques = [
        "For perfect searing, make sure your pan is hot and your protein is dry before adding it to the pan.",
        "When sautéing, keep ingredients moving in the pan and don't overcrowd to ensure even cooking.",
        "For fluffy eggs, whisk them thoroughly and cook on medium-low heat, stirring constantly.",
        "To properly caramelize onions, cook them low and slow for 20-30 minutes until golden brown."
      ]
      return techniques[Math.floor(Math.random() * techniques.length)]
    }
    
    // Ingredients and substitutions
    if (message.includes('ingredient') || message.includes('substitute') || message.includes('replace')) {
      const substitutions = [
        "No eggs? Try using 1/4 cup applesauce or 1 mashed banana per egg in baking recipes.",
        "Out of butter? Use equal amounts of coconut oil or vegetable oil in most recipes.",
        "No heavy cream? Mix 3/4 cup milk with 1/4 cup melted butter for a good substitute.",
        "Missing garlic? Use 1/8 teaspoon garlic powder for each clove of fresh garlic."
      ]
      return substitutions[Math.floor(Math.random() * substitutions.length)]
    }
    
    // Platform help
    if (message.includes('platform') || message.includes('help') || message.includes('how') || message.includes('use')) {
      const platformHelp = [
        "To share a recipe, go to the Recipes section and click 'Share Recipe'. Add your ingredients, instructions, and photos!",
        "Visit the Learning Hub to access cooking tutorials and skill-building courses from expert instructors.",
        "Join discussions in the Community Forum to connect with other cooking enthusiasts and get advice.",
        "Check your Portfolio section to showcase your culinary creations and track your learning progress."
      ]
      return platformHelp[Math.floor(Math.random() * platformHelp.length)]
    }
    
    // Meal planning
    if (message.includes('plan') || message.includes('meal') || message.includes('week')) {
      const planningTips = [
        "Start by planning 3-4 meals for the week, then make a grocery list based on those recipes.",
        "Prep ingredients on Sunday - wash vegetables, cook grains, and marinate proteins for the week.",
        "Choose one-pot or sheet-pan meals for busy weeknights to minimize cleanup time.",
        "Cook double portions and freeze half for future meals when you're short on time."
      ]
      return planningTips[Math.floor(Math.random() * planningTips.length)]
    }
    
    // Default responses
    const defaultResponses = [
      "That's an interesting question! Could you tell me more about what you'd like to know?",
      "I'd be happy to help! Can you provide more details about your cooking question?",
      "Great question! Are you looking for recipe suggestions, cooking tips, or platform guidance?",
      "I'm here to help with all things culinary! What specific area would you like assistance with?"
    ]
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)]
  }

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: content.trim(),
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    // Simulate bot typing delay
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: generateBotResponse(content),
        sender: 'bot',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, botResponse])
      setIsTyping(false)
    }, 1000 + Math.random() * 1000) // 1-2 second delay
  }

  const handleQuickSuggestion = (suggestion: string) => {
    handleSendMessage(suggestion)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSendMessage(inputValue)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Chat Assistant</h1>
        <p className="text-muted-foreground">Get instant help with cooking questions and platform guidance</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Quick Suggestions */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Help</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickSuggestions.map((suggestion, index) => {
                const Icon = suggestion.icon
                return (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start gap-2 h-auto py-3"
                    onClick={() => handleQuickSuggestion(suggestion.text)}
                  >
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="text-sm">{suggestion.text}</span>
                  </Button>
                )
              })}
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-lg">Assistant Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Recipe suggestions</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span>Cooking techniques</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full" />
                  <span>Ingredient substitutions</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full" />
                  <span>Platform guidance</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat Interface */}
        <div className="lg:col-span-3">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                ACWhisk Assistant
                <Badge variant="secondary" className="ml-auto">
                  Online
                </Badge>
              </CardTitle>
            </CardHeader>

            {/* Messages */}
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.sender === 'bot' && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div
                    className={`max-w-[70%] rounded-lg px-3 py-2 ${
                      message.sender === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-accent'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  {message.sender === 'user' && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-accent">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-3 justify-start">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-accent rounded-lg px-3 py-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </CardContent>

            {/* Input */}
            <div className="border-t p-4">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask me anything about cooking..."
                  disabled={isTyping}
                  className="flex-1"
                />
                <Button type="submit" disabled={isTyping || !inputValue.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}